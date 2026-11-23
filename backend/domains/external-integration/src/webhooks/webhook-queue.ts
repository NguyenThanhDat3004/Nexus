import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export interface WebhookJob {
  key: string;
  run: () => void | Promise<void>;
  retries?: number;
}

/**
 * Hàng đợi webhook in-memory tuần tự (FIFO) kèm cơ chế retry.
 *
 * - Chạy nền tuần tự: 1 thời điểm chỉ xử lý 1 job để bảo toàn thứ tự event.
 * - Khi job gặp lỗi: retry tối đa 5 lần với delay tăng dần [5s, 10s, 20s, 40s, 80s].
 * - Quá 5 lần retry: ghi log error và hủy bỏ job khỏi hàng đợi.
 */
@Injectable()
export class WebhookQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookQueue.name);
  private readonly queue: WebhookJob[] = [];
  private readonly retryDelays = [5_000, 10_000, 20_000, 40_000, 80_000]; // 5s, 10s, 20s, 40s, 80s

  private isRunning = false;
  private isProcessing = false;

  onModuleInit() {
    this.isRunning = true;
  }

  onModuleDestroy() {
    this.isRunning = false;
  }

  /** Đẩy job mới vào hàng đợi và kích hoạt xử lý nếu đang nhàn rỗi. */
  enqueue(key: string, run: () => void | Promise<void>): void {
    this.queue.push({ key, run, retries: 0 });
    void this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || !this.isRunning || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.isRunning && this.queue.length > 0) {
      const job = this.queue[0];
      try {
        await job.run();
        // Hoàn thành thành công -> xóa khỏi hàng đợi
        this.queue.shift();
      } catch (err: any) {
        job.retries = job.retries ?? 0;
        if (job.retries < this.retryDelays.length) {
          const delay = this.retryDelays[job.retries];
          job.retries += 1;
          this.logger.warn(
            `Job ${job.key} thất bại (lần ${job.retries}/5): ${err?.message ?? err}. Thử lại sau ${delay / 1000}s...`,
          );
          await this.sleep(delay);
        } else {
          this.logger.error(
            `Job ${job.key} thất bại sau 5 lần thử lại: ${err?.message ?? err}. Bỏ qua job.`,
          );
          // Quá 5 lần -> hủy bỏ job
          this.queue.shift();
        }
      }
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
