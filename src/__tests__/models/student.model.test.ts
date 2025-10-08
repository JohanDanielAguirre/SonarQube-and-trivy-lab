import Student from '../../models/student.model';

describe('Student model export', () => {
  test('student model is importable', () => {
    // Not instantiating mongoose document; just ensure module exports exist
    expect(Student).toBeDefined();
  });
});
