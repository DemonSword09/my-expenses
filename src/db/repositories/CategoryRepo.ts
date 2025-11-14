// src/db/repositories/CategoryRepo.ts
import { all, first, run } from '../sqlite';
import type { Category } from '../models';
import { uuidSync } from '../../utils/uuid';

export const CategoryRepo = {
  async create(payload: Partial<Category> & { parentId?: string | null }): Promise<Category> {
    const id = payload.id ?? uuidSync();
    await run(
      `INSERT INTO categories (id, label, parentId, icon, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        payload.label ?? 'Unnamed',
        payload.parentId ?? null,
        payload.icon ?? null,
        payload.color ?? null,
      ],
    );
    return {
      id,
      label: payload.label ?? 'Unnamed',
      parentId: payload.parentId ?? null,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    } as Category;
  },

  async listAll(): Promise<Category[]> {
    const rows = await all<any>('SELECT * FROM categories ORDER BY label COLLATE NOCASE ASC');
    return rows.map((r: any) => ({
      id: r.id,
      label: r.label,
      parentId: r.parentId ?? null,
      icon: r.icon ?? null,
      color: r.color ?? null,
    })) as Category[];
  },

  async listByParent(parentId: string | null): Promise<Category[]> {
    if (parentId === null) {
      const rows = await all<any>(
        'SELECT * FROM categories WHERE parentId IS NULL ORDER BY label COLLATE NOCASE ASC',
      );
      return rows.map((r: any) => ({
        id: r.id,
        label: r.label,
        parentId: r.parentId ?? null,
        icon: r.icon ?? null,
        color: r.color ?? null,
      })) as Category[];
    } else {
      const rows = await all<any>(
        'SELECT * FROM categories WHERE parentId = ? ORDER BY label COLLATE NOCASE ASC',
        [parentId],
      );
      return rows.map((r: any) => ({
        id: r.id,
        label: r.label,
        parentId: r.parentId ?? null,
        icon: r.icon ?? null,
        color: r.color ?? null,
      })) as Category[];
    }
  },

  async findById(id: string): Promise<Category | null> {
    const r = await first<any>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    if (!r) return null;
    return {
      id: r.id,
      label: r.label,
      parentId: r.parentId ?? null,
      icon: r.icon ?? null,
      color: r.color ?? null,
    } as Category;
  },
};
