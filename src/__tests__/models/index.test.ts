describe('models index', () => {
  test('index re-exports student', async () => {
    const mod = await import('../../models/index');
    expect(mod).toBeDefined();
    expect(mod.Student).toBeDefined();
  });
});
