import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../app.js';
import DeliveryNote from '../models/DeliveryNote.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import mongoose from 'mongoose';

// Crea todos los documentos necesarios para cada test y devuelve el token JWT
async function crearDatosBase() {
  // Crear compania primero con un owner provisional
  const company = await Company.create({
    owner: new mongoose.Types.ObjectId(),
    name: 'Empresa Test',
    cif: 'B12345678',
  });

  // Crear usuario con la compania ya asignada
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  const user = await User.create({
    email: 'test-albaran@example.com',
    password: hashedPassword,
    emailVerified: true,
    company: company._id,
  });

  // Actualizar el owner de la compania al usuario real
  await Company.findByIdAndUpdate(company._id, { owner: user._id });

  // Crear cliente perteneciente a la compania
  const client = await Client.create({
    user: user._id,
    company: company._id,
    name: 'Cliente Test',
    cif: 'A11111111',
  });

  // Crear proyecto perteneciente a la compania y al cliente
  const project = await Project.create({
    user: user._id,
    company: company._id,
    client: client._id,
    name: 'Proyecto Test',
    projectCode: 'PRJ-001',
  });

  // Login via API para obtener el token JWT real
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email: 'test-albaran@example.com', password: 'password123' });

  const token = loginRes.body.token;

  return { user, company, client, project, token };
}

// Crea un albaran directamente en BD con los datos minimos
async function crearAlbaran(datos) {
  return DeliveryNote.create({
    format: 'hours',
    description: 'Trabajo de prueba',
    workDate: new Date(),
    hours: 8,
    signed: false,
    deleted: false,
    ...datos,
  });
}

describe('Albaranes - control de estado', () => {

  it('re-firmar un albaran ya firmado devuelve 409', async () => {
    const { user, company, client, project, token } = await crearDatosBase();

    // Crear el albaran directamente en BD marcado como firmado
    // (evitamos llamar a Cloudinary/Sharp que son servicios externos)
    const albaran = await crearAlbaran({
      user: user._id,
      company: company._id,
      client: client._id,
      project: project._id,
      signed: true,
      signedAt: new Date(),
      signatureUrl: 'https://ejemplo.com/firma.webp',
      pdfUrl: 'https://ejemplo.com/albaran.pdf',
    });

    // El controlador comprueba deliveryNote.signed ANTES de req.file,
    // por eso no es necesario adjuntar archivo para alcanzar el error 409
    const res = await request(app)
      .patch(`/api/deliverynote/${albaran._id}/sign`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Este albarán ya está firmado');
  });

  it('borrar un albaran firmado devuelve 409', async () => {
    const { user, company, client, project, token } = await crearDatosBase();

    // Crear albaran firmado directamente en BD
    const albaran = await crearAlbaran({
      user: user._id,
      company: company._id,
      client: client._id,
      project: project._id,
      signed: true,
      signedAt: new Date(),
      signatureUrl: 'https://ejemplo.com/firma.webp',
      pdfUrl: 'https://ejemplo.com/albaran.pdf',
    });

    const res = await request(app)
      .delete(`/api/deliverynote/${albaran._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('No se puede eliminar un albarán firmado');
  });

  it('borrar albaran no firmado: no aparece en GET pero el documento sigue en BD con deleted true', async () => {
    const { user, company, client, project, token } = await crearDatosBase();

    // Crear albaran no firmado
    const albaran = await crearAlbaran({
      user: user._id,
      company: company._id,
      client: client._id,
      project: project._id,
    });

    // Borrar via API
    const deleteRes = await request(app)
      .delete(`/api/deliverynote/${albaran._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe('Albarán eliminado correctamente');

    // Verificar que NO aparece en el listado (filtro deleted: false)
    const listRes = await request(app)
      .get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.statusCode).toBe(200);
    const ids = listRes.body.deliveryNotes.map((d) => d._id.toString());
    expect(ids).not.toContain(albaran._id.toString());

    // Consulta directa al modelo: el documento existe con deleted: true
    const enBD = await DeliveryNote.findById(albaran._id);
    expect(enBD).not.toBeNull();
    expect(enBD.deleted).toBe(true);
  });

});
