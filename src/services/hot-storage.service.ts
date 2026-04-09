import { prisma } from "../config/database";

class HotStorageService {
  private static instance: HotStorageService;

  private constructor() {}

  static getInstance(): HotStorageService {
    if (!HotStorageService.instance) {
      HotStorageService.instance = new HotStorageService();
    }
    return HotStorageService.instance;
  }

  async save(userId: string, share: string): Promise<string> {
    const record = await prisma.share.create({
      data: { userId, share },
    });
    return record.id;
  }

  async get(userId: string): Promise<string> {
    const record = await prisma.share.findFirst({
      where: { userId },
    });

    if (!record) {
      throw new Error(`Share not found in hot storage for userId: ${userId}`);
    }

    return record.share;
  }

  async update(userId: string, share: string): Promise<void> {
    const record = await prisma.share.findFirst({
      where: { userId },
    });

    if (!record) {
      throw new Error(`Share not found in hot storage for userId: ${userId}`);
    }

    await prisma.share.update({
      where: { id: record.id },
      data: { share },
    });
  }

  async delete(userId: string): Promise<void> {
    const record = await prisma.share.findFirst({
      where: { userId },
    });

    if (!record) {
      throw new Error(`Share not found in hot storage for userId: ${userId}`);
    }

    await prisma.share.delete({
      where: { id: record.id },
    });
  }
}

export const hotStorageService = HotStorageService.getInstance();