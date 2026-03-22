import jwt from 'jsonwebtoken';

export const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key_change_in_prod";

// El "Portero": Verifica que el token JWT sea válido antes de dejar pasar la petición
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: "Acceso denegado: Falta Token" });

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado" });
    
    // ¡ÉXITO! Guardamos los datos del usuario en la request
    req.user = user; 
    next(); // Pasa a la siguiente función (el endpoint real)
  });
};