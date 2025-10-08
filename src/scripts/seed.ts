import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import mongoose from 'mongoose';
import { CommentModel } from '../models/comment.model';
import { ProfessorModel } from '../models/professor.model';
import Student from '../models/student.model';
import { UniversityModel } from '../models/university.model';
import { UserModel } from '../models/user.model';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('SEED: MONGODB_URI no está definido. Configure la variable de entorno y reintente.');
    process.exit(1);
  }

  // Permite reproducibilidad opcional
  if (process.env.FAKER_SEED) {
    const seedNum = Number(process.env.FAKER_SEED);
    if (!Number.isNaN(seedNum)) faker.seed(seedNum);
  }

  const dbName = process.env.MONGO_INITDB_DATABASE || process.env.DB_NAME || 'qualifica-professor';
  await mongoose.connect(uri, { dbName });
  console.log(`SEED: Conectado a MongoDB (db: ${dbName})`);

  // Modo seguro: solo crea datos si no existen
  const safeMode = process.argv.includes('--safe') || process.env.NODE_ENV === 'production';
  const reset = !safeMode && process.env.SEED_RESET !== 'false';
  
  const counts = {
    users: Number(process.env.SEED_USERS ?? 150),
    universities: Number(process.env.SEED_UNIVERSITIES ?? 120),
    professors: Number(process.env.SEED_PROFESSORS ?? 200),
    students: Number(process.env.SEED_STUDENTS ?? 150),
    comments: Number(process.env.SEED_COMMENTS ?? 500),
  };

  // En modo seguro, solo crear si no hay datos
  if (safeMode) {
    const existingUsers = await UserModel.countDocuments();
    if (existingUsers > 0) {
      console.log('SEED: Modo seguro - ya existen datos, omitiendo seed');
      await mongoose.connection.close();
      return;
    }
    console.log('SEED: Modo seguro - creando datos iniciales...');
  }

  if (reset) {
    console.log('SEED: Limpiando colecciones...');
    await Promise.all([
      UserModel.deleteMany({}),
      UniversityModel.deleteMany({}),
      ProfessorModel.deleteMany({}),
      Student.deleteMany({}),
      CommentModel.deleteMany({}),
    ]);
  }

  // Usuarios (incluye superadmin)
  console.log('SEED: Generando usuarios...');
  const password = 'password123';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const usersData: Array<any> = [];
  usersData.push({ name: 'Super Admin', email: 'admin@example.com', passwordHash: adminPasswordHash, role: 'superadmin' });
  for (let i = 0; i < counts.users; i++) {
    usersData.push({
      name: faker.person.fullName(),
      email: `user${i}@example.com`,
      passwordHash,
      role: 'user',
    });
  }
  const users = await UserModel.insertMany(usersData, { ordered: false });

  // Universidades
  console.log('SEED: Generando universidades...');
  const universitiesData: Array<any> = [];
  for (let i = 0; i < counts.universities; i++) {
    universitiesData.push({
      name: `${faker.company.name()} University ${i}`,
      country: faker.location.country(),
      city: faker.location.city(),
    });
  }
  const universities = await UniversityModel.insertMany(universitiesData, { ordered: false });

  // Profesores
  console.log('SEED: Generando profesores...');
  const professorsData: Array<any> = [];
  for (let i = 0; i < counts.professors; i++) {
    const uni = pick(universities);
    professorsData.push({
      name: faker.person.fullName(),
      department: faker.commerce.department(),
      university: uni._id,
    });
  }
  const professors = await ProfessorModel.insertMany(professorsData, { ordered: false });

  // Estudiantes
  console.log('SEED: Generando estudiantes...');
  const studentsData: Array<any> = [];
  for (let i = 0; i < counts.students; i++) {
    const uni = pick(universities);
    studentsData.push({
      nombre: faker.person.firstName(),
      apellido: faker.person.lastName(),
      email: `student${i}@example.com`,
      password, // Student.password es plano en el modelo actual
      universidad: uni._id,
      carrera: faker.person.jobArea(),
      semestre: faker.number.int({ min: 1, max: 12 }),
      activo: faker.datatype.boolean(),
    });
  }
  await Student.insertMany(studentsData, { ordered: false });

  // Comentarios
  console.log('SEED: Generando comentarios...');
  const nonAdminUsers = users.filter(u => u.role === 'user');
  const commentsData: Array<any> = [];
  for (let i = 0; i < counts.comments; i++) {
    const user = pick(nonAdminUsers);
    const prof = pick(professors);
    commentsData.push({
      user: user._id,
      professor: prof._id,
      content: faker.lorem.sentences({ min: 1, max: 3 }),
    });
  }
  await CommentModel.insertMany(commentsData, { ordered: false });

  // Resumen
  const [cu, cuv, cpf, cst, ccm] = await Promise.all([
    UserModel.countDocuments(),
    UniversityModel.countDocuments(),
    ProfessorModel.countDocuments(),
    Student.countDocuments(),
    CommentModel.countDocuments(),
  ]);

  console.log('SEED: Completado');
  console.table({ users: cu, universities: cuv, professors: cpf, students: cst, comments: ccm });
}

main()
  .then(() => mongoose.disconnect().then(() => process.exit(0)))
  .catch(async (err) => {
    console.error('SEED: Error', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  });
