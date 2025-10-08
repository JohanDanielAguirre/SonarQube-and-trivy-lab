import { jest } from '@jest/globals';

describe('Comment model toJSON transform', () => {
  test('toJSON adds id field and keeps _id', async () => {
    const { CommentModel } = await import('../../models/comment.model');
    // Create a fake doc with _id and call toJSON transform
    const doc: any = { _id: { toString: () => 'abc' }, content: 'x', toObject: () => ({ _id: { toString: () => 'abc' }, content: 'x' }) };
    // The schema transform runs on toJSON; simulate by calling model's schema transform via toJSON conversion
    const instance: any = new CommentModel({ user: 'u', professor: 'p', content: 'hi' } as any);
    const json = instance.toJSON();
    expect(json.id).toBeDefined();
    expect(json._id).toBeDefined();
  });
});
