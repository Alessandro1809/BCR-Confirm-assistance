import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false; // Marca explícitamente que esta ruta no debe ser pre-renderizada

// Configurar el transporter de Nodemailer con configuraciones SMTP más específicas
const transporter = nodemailer.createTransport({
    host: 'in-v3.mailjet.com',
    port: 2525,
    auth: {
      user: import.meta.env.EMAIL_USER,
      pass: import.meta.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Permite certificados autofirmados
    },
    // Configuraciones adicionales para mejorar la entrega
    pool: true, // Usa conexiones persistentes
    maxConnections: 1,
    maxMessages: 3,
    socketTimeout: 120000, // 60 segundos
    logger: true, // Habilita logging detallado
    debug: true // Muestra debug info
});

// Verificar la conexión al iniciar
transporter.verify(function(error, success) {
    if (error) {
        console.error('Error en la configuración del servidor SMTP:', error);
    } else {
        console.log('Servidor SMTP está listo para enviar mensajes');
    }
});

export const POST: APIRoute = async ({ request }) => {
    try {
        // Verificar credenciales
        if (!import.meta.env.EMAIL_USER || !import.meta.env.EMAIL_PASS) {
            console.error('Credenciales de correo no encontradas');
            throw new Error('Configuración de correo no disponible');
        }

        if (!request.body) {
            throw new Error('No se recibieron datos');
        }

        const data = await request.json();
        const { nombreCompleto, cedula, correo } = data;

        // Validaciones
        if (!nombreCompleto || !cedula || !correo) {
            return new Response(JSON.stringify({
                error: 'Todos los campos son requeridos'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        if (!correo.endsWith('@bancobcr.com')) {
            return new Response(JSON.stringify({
                error: 'El correo debe ser institucional (@bancobcr.com)'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        // Configuración común para los correos
        const commonConfig = {
            from: {
                name: '<no-reply>',
                address: 'stellarteamcr@gmail.com'
            },
            replyTo: import.meta.env.EMAIL_USER,
            headers: {
                'X-Priority': '1', // Alta prioridad
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            }
        };

        // Enviar correo al administrador
        const adminMailOptions = {
            ...commonConfig,
            to: {
                name: 'Marjorie Jerez Lopez',
                address: 'ashsevilla@bancobcr.com'
            },
            subject: `Nueva confirmación de asistencia - ${nombreCompleto}`,
            text: `
                Nueva confirmación de asistencia:
                
                Nombre: ${nombreCompleto}
                Cédula: ${cedula}
                Correo: ${correo}
                
                Esta persona ha confirmado su asistencia al evento.
            `.trim(),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #003B7E; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #ffffff; margin: 0; text-align: center;">Nueva Confirmación de Asistencia</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px; border-left: 4px solid #003B7E; padding-left: 15px;">
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${nombreCompleto}</p>
                            <p style="margin: 5px 0;"><strong>Cédula:</strong> ${cedula}</p>
                            <p style="margin: 5px 0;"><strong>Correo:</strong> ${correo}</p>
                        </div>
                        
                        <p style="background-color: #e8f5e9; padding: 10px; border-radius: 5px; color: #2e7d32;">
                            ✓ Esta persona ha confirmado su asistencia al evento del 26 de junio a las 6:00 PM en BCR Cañas.
                        </p>
                        <p style="color: #333; line-height: 1.6;">
                           Fecha de registro: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666;">
                        <p style="font-size: 12px;">Este es un mensaje automático, por favor no responder directamente.</p>
                    </div>
                </div>
            `.trim(),
            messageId: `<confirmation-admin-${Date.now()}@bcrcanas.com>`
        };

        // Enviar correo al usuario
        const userMailOptions = {
            ...commonConfig,
            to: {
                name: nombreCompleto,
                address: correo
            },
            subject: 'Confirmación de asistencia - Evento BCR Cañas',
            text: `
                ¡Hola ${nombreCompleto}!

                Hemos recibido tu confirmación de asistencia para el evento del 26 de junio a las 6:00 PM en BCR Cañas.

                Detalles de tu registro:
                - Nombre: ${nombreCompleto}
                - Cédula: ${cedula}

                Te esperamos con mucha ilusión.

                Saludos cordiales,
                Equipo BCR Cañas
            `.trim(),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #003B7E; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h2 style="color: #ffffff; margin: 0; text-align: center;">¡Confirmación Exitosa!</h2>
                    </div>
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h3 style="color: #003B7E;">¡Hola ${nombreCompleto}!</h3>
                        
                        <p style="color: #333; line-height: 1.6;">
                            Hemos recibido tu confirmación de asistencia para nuestro evento especial.
                        </p>

                        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h4 style="color: #003B7E; margin-top: 0;">Detalles del Evento:</h4>
                            <p style="margin: 5px 0;">📅 <strong>Fecha:</strong> 26 de junio</p>
                            <p style="margin: 5px 0;">⏰ <strong>Hora:</strong> 6:00 PM</p>
                            <p style="margin: 5px 0;">📍 <strong>Lugar:</strong> BCR Cañas</p>
                        </div>

                        <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h4 style="color: #003B7E; margin-top: 0;">Datos de tu Registro:</h4>
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${nombreCompleto}</p>
                            <p style="margin: 5px 0;"><strong>Cédula:</strong> ${cedula}</p>
                        </div>

                        <p style="color: #333; line-height: 1.6;">
                            Te esperamos con mucha ilusión. Tu presencia es muy importante para nosotros.
                        </p>

                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #003B7E; font-weight: bold;">¡Nos vemos pronto!</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">Saludos cordiales,<br>Equipo de coordinación BCR</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666;">
                        <p style="font-size: 12px;">Este es un mensaje automático, por favor no responder directamente.</p>
                    </div>
                </div>
            `.trim(),
            messageId: `<confirmation-user-${Date.now()}@bcrcanas.com>`
        };

        try {
            // Enviar ambos correos y esperar las respuestas
            console.log('Intentando enviar correos...');
            
            const [adminInfo, userInfo] = await Promise.all([
                transporter.sendMail(adminMailOptions).catch(error => {
                    console.error('Error al enviar correo admin:', error);
                    throw error;
                }),
                transporter.sendMail(userMailOptions).catch(error => {
                    console.error('Error al enviar correo usuario:', error);
                    throw error;
                })
            ]);

            console.log('Detalles del envío al admin:', {
                messageId: adminInfo.messageId,
                response: adminInfo.response,
                envelope: adminInfo.envelope
            });

            console.log('Detalles del envío al usuario:', {
                messageId: userInfo.messageId,
                response: userInfo.response,
                envelope: userInfo.envelope
            });

            return new Response(JSON.stringify({
                message: 'Correos enviados exitosamente',
                adminDelivery: adminInfo.response,
                userDelivery: userInfo.response
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (sendError) {
            console.error('Error específico al enviar correos:', sendError);
            throw new Error(`Error al enviar correos: ${sendError instanceof Error ? sendError.message : 'Error desconocido'}`);
        }

    } catch (error) {
        console.error('Error detallado:', error);
        return new Response(JSON.stringify({
            error: 'Error al enviar los correos',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};