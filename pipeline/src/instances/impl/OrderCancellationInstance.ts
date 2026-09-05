import { QueueInstance } from "../classes/QueueInstance";
import { OrderMessage } from "../../definitions/messages/OrderMessage";
import { OrdersDatabase } from "../../databases/OrdersDatabase";
import { OrderStatus } from "../../definitions/enums/OrderStatus";
import { EmailService } from "../../services/email/EmailService";

const { SQS_ORDER_CANCELLATION_QUEUE_NAME } = process.env;

export class OrderCancellationInstance extends QueueInstance<OrderMessage> {
  constructor() {
    super({ loggerPrefix: "OrderCancellationInstance", queueName: SQS_ORDER_CANCELLATION_QUEUE_NAME });
  }

  protected getRequiredMessageFields(): Array<keyof OrderMessage> {
    return ["orderId"];
  }

  /**
   * Send a cancellation email to the customer and record the cancellation timestamp.
   * @param message
   * @protected
   */
  protected async process({ orderId }: OrderMessage): Promise<void> {
    const order = await OrdersDatabase.getOrderById(orderId);

    if (!order) {
      this.logger.warn(`Order ${orderId} not found, likely already processed`);
      return;
    }
    if (order.status !== OrderStatus.CANCELLED) {
      this.logger.warn(`Order ${orderId} is not in CANCELLED state`);
      return;
    }

    await EmailService.sendCancellationEmail({ order });
    this.logger.info(`Order ${orderId} cancellation email sent`);

    await OrdersDatabase.deleteOrder(order.orderId);
    this.logger.info(`Order ${orderId} deleted`);
  }
}
