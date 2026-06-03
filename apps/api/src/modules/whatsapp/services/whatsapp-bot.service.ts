import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { WhatsAppMetaService } from './whatsapp-meta.service';

/**
 * Bot States:
 * start → welcome → browse_categories → browse_products → product_detail
 *       → cart → checkout_address → checkout_governorate → checkout_confirm → order_complete
 *       → track_order
 *       → agent (human takeover)
 */

interface BotContext {
  selectedCategoryId?: string;
  selectedCategoryName?: string;
  selectedProductId?: string;
  selectedProductName?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingGovernorate?: string;
  shippingCity?: string;
  lastOrderId?: string;
}

interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  unitPrice: number; // in piasters
  quantity: number;
}

@Injectable()
export class WhatsAppBotService {
  private readonly logger = new Logger(WhatsAppBotService.name);
  private readonly TENANT_ID = 'a0000000-0000-0000-0000-000000000001'; // Brushia tenant

  constructor(
    private readonly db: DatabaseService,
    private readonly meta: WhatsAppMetaService,
  ) {}

  /**
   * Main entry point — process incoming message
   */
  async processIncomingMessage(
    phone: string,
    waMessageId: string,
    messageType: string,
    content: string,
    buttonPayload?: string,
    listPayload?: string,
  ): Promise<void> {
    // Mark as read
    await this.meta.markAsRead(waMessageId);

    // Find or create conversation
    let convo = await this.findOrCreateConversation(phone);

    // Store inbound message
    await this.storeMessage(convo.id, 'inbound', content, waMessageId, messageType);

    // If bot is disabled (human agent mode), skip
    if (!convo.bot_enabled) {
      this.logger.log(`Bot disabled for conversation ${convo.id}, skipping`);
      return;
    }

    // Get effective input (button/list payload takes priority)
    const input = buttonPayload || listPayload || content;

    // Check for global commands
    const lowerInput = input.toLowerCase().trim();
    if (['agent', 'help', 'human', 'مساعدة'].includes(lowerInput)) {
      await this.switchToAgent(convo);
      return;
    }
    if (['menu', 'start', 'hi', 'hello', 'مرحبا', 'السلام'].some(k => lowerInput.includes(k)) && convo.bot_state !== 'start') {
      await this.resetToWelcome(convo);
      return;
    }

    // Route to state handler
    await this.handleState(convo, input);
  }

  private async handleState(convo: any, input: string): Promise<void> {
    const state = convo.bot_state || 'start';
    const context: BotContext = convo.bot_context || {};
    const cart: CartItem[] = convo.cart || [];

    switch (state) {
      case 'start':
        await this.sendWelcome(convo);
        break;

      case 'welcome':
        await this.handleWelcomeResponse(convo, input);
        break;

      case 'browse_categories':
        await this.handleCategorySelection(convo, input, context);
        break;

      case 'browse_products':
        await this.handleProductSelection(convo, input, context);
        break;

      case 'product_detail':
        await this.handleProductAction(convo, input, context, cart);
        break;

      case 'cart':
        await this.handleCartAction(convo, input, cart);
        break;

      case 'checkout_address':
        await this.handleAddressInput(convo, input, context);
        break;

      case 'checkout_governorate':
        await this.handleGovernorateInput(convo, input, context);
        break;

      case 'checkout_address_detail':
        await this.handleAddressDetail(convo, input, context, cart);
        break;

      case 'checkout_confirm':
        await this.handleOrderConfirmation(convo, input, context, cart);
        break;

      case 'track_order':
        await this.handleTrackOrder(convo, input);
        break;

      default:
        await this.sendWelcome(convo);
    }
  }

  // ========== STATE HANDLERS ==========

  private async sendWelcome(convo: any): Promise<void> {
    const name = convo.customer_name || 'there';
    const msg = `✨ Welcome to our store 💄\nHi ${name}! I'm your beauty assistant.\n\nHow can I help you today?`;

    await this.meta.sendButtons(convo.customer_phone, msg, [
      { id: 'browse_catalog', title: '🛍️ Browse Products' },
      { id: 'track_order', title: '📦 Track My Order' },
      { id: 'talk_agent', title: '💬 Talk to Agent' },
    ]);

    await this.updateConvoState(convo.id, 'welcome', {});
  }

  private async handleWelcomeResponse(convo: any, input: string): Promise<void> {
    if (input === 'browse_catalog' || input.toLowerCase().includes('browse') || input.toLowerCase().includes('shop')) {
      await this.sendCategories(convo);
    } else if (input === 'track_order' || input.toLowerCase().includes('track')) {
      await this.meta.sendText(convo.customer_phone, '📦 Please enter your order number (e.g., SO-000001):');
      await this.updateConvoState(convo.id, 'track_order', {});
    } else if (input === 'talk_agent') {
      await this.switchToAgent(convo);
    } else {
      await this.sendWelcome(convo);
    }
  }

  private async sendCategories(convo: any): Promise<void> {
    const categories = await this.db.query(
      `SELECT id, name FROM catalog.categories WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order`,
      [this.TENANT_ID],
    );

    if (!categories.rows.length) {
      await this.meta.sendText(convo.customer_phone, 'Sorry, no categories available right now. Please try later! 😊');
      return;
    }

    const rows = categories.rows.map((c: any) => ({
      id: `cat_${c.id}`,
      title: c.name,
      description: `Browse ${c.name} products`,
    }));

    await this.meta.sendList(
      convo.customer_phone,
      '💄 *Product Categories*\n\nChoose a category to explore:',
      'View Categories',
      [{ title: 'Categories', rows }],
    );

    await this.updateConvoState(convo.id, 'browse_categories', {});
  }

  private async handleCategorySelection(convo: any, input: string, context: BotContext): Promise<void> {
    const catId = input.startsWith('cat_') ? input.replace('cat_', '') : null;

    if (!catId) {
      await this.sendCategories(convo);
      return;
    }

    // Get products in category
    const products = await this.db.query(
      `SELECT p.id, p.name, p.base_price, p.images,
        (SELECT COUNT(*)::int FROM catalog.product_variants v WHERE v.product_id = p.id) as variant_count
       FROM catalog.products p
       WHERE p.tenant_id = $1 AND p.category_id = $2 AND p.is_active = true AND p.status = 'active'
       ORDER BY p.name LIMIT 10`,
      [this.TENANT_ID, catId],
    );

    const category = await this.db.queryOne(
      'SELECT name FROM catalog.categories WHERE id = $1 AND tenant_id = $2',
      [catId, this.TENANT_ID],
    );

    if (!products.rows.length) {
      await this.meta.sendText(convo.customer_phone, `No products found in ${category?.name || 'this category'}. Try another! 😊`);
      await this.sendCategories(convo);
      return;
    }

    const rows = products.rows.map((p: any) => ({
      id: `prod_${p.id}`,
      title: p.name,
      description: `EGP ${(Number(p.base_price) / 100).toFixed(2)}${p.variant_count > 0 ? ` • ${p.variant_count} colors` : ''}`,
    }));

    await this.meta.sendList(
      convo.customer_phone,
      `🛍️ *${category?.name || 'Products'}*\n\nSelect a product to see details:`,
      'View Products',
      [{ title: category?.name || 'Products', rows }],
    );

    await this.updateConvoState(convo.id, 'browse_products', {
      ...context,
      selectedCategoryId: catId,
      selectedCategoryName: category?.name || '',
    });
  }

  private async handleProductSelection(convo: any, input: string, context: BotContext): Promise<void> {
    const productId = input.startsWith('prod_') ? input.replace('prod_', '') : null;

    if (input === 'back_categories' || !productId) {
      await this.sendCategories(convo);
      return;
    }

    const product = await this.db.queryOne(
      `SELECT p.*, c.name as category_name FROM catalog.products p
       JOIN catalog.categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [productId, this.TENANT_ID],
    );

    if (!product) {
      await this.meta.sendText(convo.customer_phone, 'Product not found. Please try again.');
      return;
    }

    // Get variants
    const variants = await this.db.query(
      `SELECT id, name, sku, additional_price FROM catalog.product_variants
       WHERE product_id = $1 AND is_active = true ORDER BY sort_order, name`,
      [productId],
    );

    const price = (Number(product.base_price) / 100).toFixed(2);
    const vatPrice = (Number(product.base_price) / 100 * 1.14).toFixed(2);

    let msg = `💄 *${product.name}*\n\n`;
    msg += `💰 Price: EGP ${price} (EGP ${vatPrice} inc. VAT)\n`;
    msg += `📦 Category: ${product.category_name}\n`;
    msg += `🔖 SKU: ${product.sku}\n`;

    if (variants.rows.length > 0) {
      msg += `\n🎨 Available colors: ${variants.rows.map((v: any) => v.name).join(', ')}\n`;
    }

    // Send product image if available
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
    if (images && images.length > 0 && images[0]) {
      try {
        await this.meta.sendImage(convo.customer_phone, images[0], product.name);
      } catch (e) {
        // Image send failed, continue with text
      }
    }

    // If variants exist, show as list; otherwise show add to cart button
    if (variants.rows.length > 1) {
      const variantRows = variants.rows.map((v: any) => ({
        id: `var_${v.id}`,
        title: v.name,
        description: v.additional_price > 0
          ? `+EGP ${(Number(v.additional_price) / 100).toFixed(2)}`
          : `EGP ${price}`,
      }));
      await this.meta.sendList(
        convo.customer_phone,
        msg + '\nSelect your color:',
        'Choose Color',
        [{ title: 'Colors', rows: variantRows }],
      );
    } else {
      await this.meta.sendButtons(convo.customer_phone, msg, [
        { id: 'add_to_cart', title: '🛒 Add to Cart' },
        { id: 'back_products', title: '⬅️ Back' },
        { id: 'view_cart', title: '🛒 View Cart' },
      ]);
    }

    await this.updateConvoState(convo.id, 'product_detail', {
      ...context,
      selectedProductId: productId,
      selectedProductName: product.name,
    });
  }

  private async handleProductAction(convo: any, input: string, context: BotContext, cart: CartItem[]): Promise<void> {
    if (input === 'back_products') {
      await this.handleCategorySelection(convo, `cat_${context.selectedCategoryId}`, context);
      return;
    }

    if (input === 'view_cart') {
      await this.sendCartSummary(convo, cart);
      return;
    }

    // Handle variant selection or direct add to cart
    let variantId: string | undefined;
    let variantName: string | undefined;
    let extraPrice = 0;

    if (input.startsWith('var_')) {
      variantId = input.replace('var_', '');
      const variant = await this.db.queryOne(
        'SELECT * FROM catalog.product_variants WHERE id = $1', [variantId],
      );
      if (variant) {
        variantName = variant.name;
        extraPrice = Number(variant.additional_price || 0);
      }
    }

    if (input === 'add_to_cart' || input.startsWith('var_')) {
      const product = await this.db.queryOne(
        'SELECT id, name, sku, base_price FROM catalog.products WHERE id = $1',
        [context.selectedProductId],
      );

      if (!product) {
        await this.meta.sendText(convo.customer_phone, 'Product not found. Please try again.');
        return;
      }

      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        variantId,
        variantName,
        sku: product.sku,
        unitPrice: Number(product.base_price) + extraPrice,
        quantity: 1,
      };

      // Check if item already in cart (same product + variant)
      const existingIdx = cart.findIndex(
        i => i.productId === newItem.productId && i.variantId === newItem.variantId,
      );
      if (existingIdx >= 0) {
        cart[existingIdx].quantity += 1;
      } else {
        cart.push(newItem);
      }

      await this.updateConvoCart(convo.id, cart);

      const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
      const label = variantName ? `${product.name} (${variantName})` : product.name;

      await this.meta.sendButtons(
        convo.customer_phone,
        `✅ *${label}* added to cart!\n\n🛒 Cart: ${totalItems} item${totalItems > 1 ? 's' : ''}`,
        [
          { id: 'continue_shopping', title: '🛍️ Continue' },
          { id: 'view_cart', title: '🛒 View Cart' },
          { id: 'checkout', title: '✅ Checkout' },
        ],
      );
      return;
    }

    if (input === 'continue_shopping') {
      await this.sendCategories(convo);
      return;
    }

    if (input === 'checkout') {
      if (cart.length === 0) {
        await this.meta.sendText(convo.customer_phone, '🛒 Your cart is empty! Browse our products first.');
        await this.sendCategories(convo);
        return;
      }
      await this.startCheckout(convo, cart, context);
      return;
    }

    // Unknown input in product detail
    await this.meta.sendButtons(convo.customer_phone, 'What would you like to do?', [
      { id: 'add_to_cart', title: '🛒 Add to Cart' },
      { id: 'back_products', title: '⬅️ Back' },
      { id: 'view_cart', title: '🛒 View Cart' },
    ]);
  }

  private async sendCartSummary(convo: any, cart: CartItem[]): Promise<void> {
    if (cart.length === 0) {
      await this.meta.sendButtons(convo.customer_phone, '🛒 Your cart is empty!', [
        { id: 'browse_catalog', title: '🛍️ Browse Products' },
      ]);
      await this.updateConvoState(convo.id, 'welcome', {});
      return;
    }

    let msg = '🛒 *Your Cart*\n\n';
    let subtotal = 0;
    cart.forEach((item, i) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      const label = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
      msg += `${i + 1}. ${label}\n   ${item.quantity}x EGP ${(item.unitPrice / 100).toFixed(2)} = EGP ${(itemTotal / 100).toFixed(2)}\n\n`;
    });

    const vat = subtotal * 0.14;
    const total = subtotal + vat;
    msg += `───────────────\n`;
    msg += `Subtotal: EGP ${(subtotal / 100).toFixed(2)}\n`;
    msg += `VAT (14%): EGP ${(vat / 100).toFixed(2)}\n`;
    msg += `*Total: EGP ${(total / 100).toFixed(2)}*`;

    await this.meta.sendButtons(convo.customer_phone, msg, [
      { id: 'checkout', title: '✅ Checkout' },
      { id: 'clear_cart', title: '🗑️ Clear Cart' },
      { id: 'continue_shopping', title: '🛍️ Add More' },
    ]);

    await this.updateConvoState(convo.id, 'cart', convo.bot_context || {});
  }

  private async handleCartAction(convo: any, input: string, cart: CartItem[]): Promise<void> {
    if (input === 'checkout') {
      await this.startCheckout(convo, cart, convo.bot_context || {});
    } else if (input === 'clear_cart') {
      await this.updateConvoCart(convo.id, []);
      await this.meta.sendText(convo.customer_phone, '🗑️ Cart cleared!');
      await this.sendWelcome(convo);
    } else if (input === 'continue_shopping') {
      await this.sendCategories(convo);
    } else {
      await this.sendCartSummary(convo, cart);
    }
  }

  private async startCheckout(convo: any, cart: CartItem[], context: BotContext): Promise<void> {
    await this.meta.sendText(
      convo.customer_phone,
      '📍 *Shipping Information*\n\nPlease send your *full name and phone number* in this format:\n\n`Name, Phone`\n\nExample: `Ahmed Mohamed, 01012345678`',
    );
    await this.updateConvoState(convo.id, 'checkout_address', context);
  }

  private async handleAddressInput(convo: any, input: string, context: BotContext): Promise<void> {
    // Parse "Name, Phone" format
    const parts = input.split(',').map(s => s.trim());
    if (parts.length < 2) {
      await this.meta.sendText(
        convo.customer_phone,
        '❌ Please use the format: `Name, Phone`\n\nExample: `Ahmed Mohamed, 01012345678`',
      );
      return;
    }

    const name = parts[0];
    const phone = parts[1].replace(/\s/g, '');

    context.shippingName = name;
    context.shippingPhone = phone;

    // Send governorate list
    const governorates = [
      'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Sharqia', 'Dakahlia',
      'Gharbia', 'Monufia', 'Beheira', 'Kafr El Sheikh', 'Damietta',
      'Port Said', 'Ismailia', 'Suez', 'North Sinai', 'South Sinai',
      'Red Sea', 'Fayoum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag',
      'Qena', 'Luxor', 'Aswan', 'New Valley', 'Matrouh',
    ];

    const rows = governorates.slice(0, 10).map(g => ({
      id: `gov_${g.toLowerCase().replace(/\s/g, '_')}`,
      title: g,
      description: '',
    }));

    await this.meta.sendList(
      convo.customer_phone,
      `👍 Name: *${name}*\nPhone: *${phone}*\n\n📍 Select your *governorate*:`,
      'Select Governorate',
      [{ title: 'Governorates', rows }],
    );

    await this.updateConvoState(convo.id, 'checkout_governorate', context);
  }

  private async handleGovernorateInput(convo: any, input: string, context: BotContext): Promise<void> {
    const gov = input.startsWith('gov_')
      ? input.replace('gov_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : input.trim();

    context.shippingGovernorate = gov;

    await this.meta.sendText(
      convo.customer_phone,
      `📍 Governorate: *${gov}*\n\nNow please send your *full delivery address* (street, building, floor, apartment):`,
    );

    await this.updateConvoState(convo.id, 'checkout_address_detail', context);
  }

  private async handleOrderConfirmation(convo: any, input: string, context: BotContext, cart: CartItem[]): Promise<void> {
    if (input === 'confirm_order') {
      // Create the sales order
      const order = await this.createSalesOrder(convo, cart, context);

      const msg = `🎉 *Order Confirmed!*\n\n` +
        `📋 Order: *${order.orderNumber}*\n` +
        `💰 Total: *EGP ${(order.total / 100).toFixed(2)}*\n` +
        `📍 Shipping to: ${context.shippingGovernorate}\n` +
        `📞 Phone: ${context.shippingPhone}\n\n` +
        `We'll prepare your order and send you tracking updates! 💄✨\n\n` +
        `Payment: Cash on Delivery (COD) 🚚`;

      await this.meta.sendButtons(convo.customer_phone, msg, [
        { id: 'browse_catalog', title: '🛍️ Shop More' },
        { id: 'track_order', title: '📦 Track Order' },
      ]);

      // Clear cart and mark converted
      await this.updateConvoCart(convo.id, []);
      await this.db.query(
        `UPDATE whatsapp.conversations SET status = 'converted', sales_order_id = $3,
         converted_at = NOW(), bot_state = 'order_complete', updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [convo.id, this.TENANT_ID, order.id],
      );
      return;
    }

    if (input === 'cancel_order') {
      await this.meta.sendText(convo.customer_phone, '❌ Order cancelled. Your cart is still saved.');
      await this.sendCartSummary(convo, cart);
      return;
    }

    // Show confirmation again
    await this.sendOrderConfirmation(convo, cart, context);
  }

  private async sendOrderConfirmation(convo: any, cart: CartItem[], context: BotContext): Promise<void> {
    let subtotal = 0;
    let msg = '📋 *Order Summary*\n\n';
    cart.forEach((item, i) => {
      const itemTotal = item.unitPrice * item.quantity;
      subtotal += itemTotal;
      const label = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
      msg += `${i + 1}. ${label} x${item.quantity} — EGP ${(itemTotal / 100).toFixed(2)}\n`;
    });

    const vat = subtotal * 0.14;
    const shipping = 5000; // 50 EGP flat for now
    const total = subtotal + vat + shipping;

    msg += `\n───────────────\n`;
    msg += `Subtotal: EGP ${(subtotal / 100).toFixed(2)}\n`;
    msg += `VAT (14%): EGP ${(vat / 100).toFixed(2)}\n`;
    msg += `Shipping: EGP ${(shipping / 100).toFixed(2)}\n`;
    msg += `*Total: EGP ${(total / 100).toFixed(2)}*\n\n`;
    msg += `📍 *Ship to:*\n`;
    msg += `${context.shippingName}\n`;
    msg += `${context.shippingPhone}\n`;
    msg += `${context.shippingAddress || ''}, ${context.shippingGovernorate}\n\n`;
    msg += `💳 Payment: Cash on Delivery`;

    await this.meta.sendButtons(convo.customer_phone, msg, [
      { id: 'confirm_order', title: '✅ Confirm Order' },
      { id: 'cancel_order', title: '❌ Cancel' },
    ]);

    await this.updateConvoState(convo.id, 'checkout_confirm', context);
  }

  private async handleTrackOrder(convo: any, input: string): Promise<void> {
    const orderNumber = input.trim().toUpperCase();
    const order = await this.db.queryOne(
      `SELECT so.*, sc.first_name, sc.last_name FROM sales.sales_orders so
       LEFT JOIN sales.customers sc ON sc.id = so.customer_id
       WHERE so.tenant_id = $1 AND so.order_number = $2`,
      [this.TENANT_ID, orderNumber],
    );

    if (!order) {
      await this.meta.sendButtons(
        convo.customer_phone,
        `❌ Order *${orderNumber}* not found.\n\nPlease check the number and try again.`,
        [
          { id: 'track_order', title: '🔍 Try Again' },
          { id: 'talk_agent', title: '💬 Talk to Agent' },
        ],
      );
      await this.updateConvoState(convo.id, 'welcome', {});
      return;
    }

    const statusEmoji: Record<string, string> = {
      pending: '⏳', confirmed: '✅', processing: '📦', shipped: '🚚', delivered: '✅', cancelled: '❌',
    };

    const msg = `📦 *Order ${order.order_number}*\n\n` +
      `Status: ${statusEmoji[order.status] || '📋'} ${order.status.toUpperCase()}\n` +
      `Total: EGP ${(Number(order.total) / 100).toFixed(2)}\n` +
      `Payment: ${order.payment_status}\n` +
      `Date: ${new Date(order.ordered_at).toLocaleDateString('en-EG')}`;

    await this.meta.sendButtons(convo.customer_phone, msg, [
      { id: 'browse_catalog', title: '🛍️ Shop More' },
      { id: 'talk_agent', title: '💬 Need Help?' },
    ]);
    await this.updateConvoState(convo.id, 'welcome', {});
  }


  private async handleAddressDetail(convo: any, input: string, context: BotContext, cart: CartItem[]): Promise<void> {
    context.shippingAddress = input.trim();
    await this.updateConvoState(convo.id, 'checkout_confirm', context);
    await this.sendOrderConfirmation(convo, cart, context);
  }
  // ========== ORDER CREATION ==========

  private async createSalesOrder(convo: any, cart: CartItem[], context: BotContext): Promise<any> {
    // Generate order number
    const numResult = await this.db.queryOne(
      `SELECT 'SO-' || LPAD((COUNT(*) + 1)::text, 6, '0') as next_number FROM sales.sales_orders WHERE tenant_id = $1`,
      [this.TENANT_ID],
    );

    let subtotal = 0;
    for (const item of cart) subtotal += item.unitPrice * item.quantity;
    const taxAmount = Math.round(subtotal * 0.14);
    const shippingAmount = 5000; // 50 EGP
    const total = subtotal + taxAmount + shippingAmount;

    const shippingAddress = {
      name: context.shippingName,
      phone: context.shippingPhone,
      address: context.shippingAddress || '',
      governorate: context.shippingGovernorate,
      city: context.shippingCity || context.shippingGovernorate,
    };

    // Find or create customer
    let customerId = convo.customer_id;
    if (!customerId) {
      const existing = await this.db.queryOne(
        `SELECT id FROM sales.customers WHERE tenant_id = $1 AND (phone = $2 OR whatsapp = $2)`,
        [this.TENANT_ID, convo.customer_phone],
      );
      if (existing) {
        customerId = existing.id;
      } else {
        const custNum = `C-${Date.now().toString(36).toUpperCase()}`;
        const newCust = await this.db.queryOne(
          `INSERT INTO sales.customers (tenant_id, customer_number, first_name, phone, whatsapp, customer_type, governorate)
           VALUES ($1, $2, $3, $4, $4, 'retail', $5) RETURNING id`,
          [this.TENANT_ID, custNum, context.shippingName || 'WhatsApp Customer', convo.customer_phone, context.shippingGovernorate],
        );
        customerId = newCust.id;
      }
      // Link customer to conversation
      await this.db.query(
        'UPDATE whatsapp.conversations SET customer_id = $3 WHERE id = $1 AND tenant_id = $2',
        [convo.id, this.TENANT_ID, customerId],
      );
    }

    const order = await this.db.queryOne(
      `INSERT INTO sales.sales_orders
        (tenant_id, order_number, customer_id, status, order_type, channel, subtotal, tax_amount, shipping_amount, total, payment_status, shipping_address, notes)
       VALUES ($1, $2, $3, 'confirmed', 'retail', 'whatsapp', $4, $5, $6, $7, 'unpaid', $8, $9) RETURNING *`,
      [this.TENANT_ID, numResult.next_number, customerId, subtotal, taxAmount, shippingAmount, total,
       JSON.stringify(shippingAddress), `WhatsApp order from ${convo.customer_phone}`],
    );

    // Create order items
    for (const item of cart) {
      await this.db.query(
        `INSERT INTO sales.order_items (tenant_id, order_id, product_id, variant_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [this.TENANT_ID, order.id, item.productId, item.variantId || null, item.quantity, item.unitPrice, item.unitPrice * item.quantity],
      );
    }

    return { id: order.id, orderNumber: numResult.next_number, total };
  }

  // ========== HELPERS ==========

  private async findOrCreateConversation(phone: string): Promise<any> {
    // Find existing open conversation
    let convo = await this.db.queryOne(
      `SELECT * FROM whatsapp.conversations WHERE tenant_id = $1 AND customer_phone = $2 AND status IN ('open', 'active')
       ORDER BY created_at DESC LIMIT 1`,
      [this.TENANT_ID, phone],
    );

    if (!convo) {
      convo = await this.db.queryOne(
        `INSERT INTO whatsapp.conversations (tenant_id, customer_phone, customer_name, status, bot_enabled, bot_state, source, cart)
         VALUES ($1, $2, $3, 'open', true, 'start', 'whatsapp', '[]') RETURNING *`,
        [this.TENANT_ID, phone, phone],
      );
    }

    return convo;
  }

  private async storeMessage(conversationId: string, direction: string, content: string, waMessageId?: string, messageType?: string): Promise<void> {
    await this.db.query(
      `INSERT INTO whatsapp.messages (tenant_id, conversation_id, direction, content, message_type, wa_message_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [this.TENANT_ID, conversationId, direction, content, messageType || 'text', waMessageId || null],
    );
    await this.db.query(
      `UPDATE whatsapp.conversations SET last_message_at = NOW(), message_count = message_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [conversationId],
    );
  }

  private async updateConvoState(convoId: string, state: string, context: BotContext): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp.conversations SET bot_state = $2, bot_context = $3, updated_at = NOW() WHERE id = $1`,
      [convoId, state, JSON.stringify(context)],
    );
  }

  private async updateConvoCart(convoId: string, cart: CartItem[]): Promise<void> {
    await this.db.query(
      `UPDATE whatsapp.conversations SET cart = $2, updated_at = NOW() WHERE id = $1`,
      [convoId, JSON.stringify(cart)],
    );
  }

  private async switchToAgent(convo: any): Promise<void> {
    await this.meta.sendText(
      convo.customer_phone,
      '👋 Connecting you to our team!\n\nA human agent will reply shortly. Type *menu* anytime to return to the bot.',
    );
    await this.db.query(
      `UPDATE whatsapp.conversations SET bot_enabled = false, assigned_to = NULL, updated_at = NOW() WHERE id = $1`,
      [convo.id],
    );
  }

  private async resetToWelcome(convo: any): Promise<void> {
    await this.updateConvoState(convo.id, 'start', {});
    convo.bot_state = 'start';
    await this.sendWelcome(convo);
  }
}
