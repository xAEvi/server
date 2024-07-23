const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const port = 5000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "comunidaddesarrollo",
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Registrarse
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  db.query(
    "SELECT * FROM usuario WHERE correo_electronico = ?",
    [email],
    (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        db.query(
          "INSERT INTO usuario (nombre, correo_electronico, contrasena) VALUES (?, ?, ?)",
          [name, email, hashedPassword],
          (err) => {
            if (err) throw err;
            res.status(201).json({ message: "User registered successfully" });
          }
        );
      });
    }
  );
});

// Iniciar sesión
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM usuario WHERE correo_electronico = ?",
    [email],
    (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];

      bcrypt.compare(password, user.contrasena, (err, isMatch) => {
        if (err) throw err;

        if (!isMatch) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({ message: "Login successful", userId: user.id });
      });
    }
  );
});

app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categoria", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/api/posts", (req, res) => {
  const query = `
    SELECT
      publicacion.id,
      publicacion.titulo,
      publicacion.contenido,
      publicacion.fecha_creacion,
      categoria.nombre AS categoria_nombre,
      usuario.nombre AS usuario_nombre
    FROM
      publicacion
    JOIN
      categoria ON publicacion.categoria_id = categoria.id
    JOIN
      usuario ON publicacion.usuario_id = usuario.id
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// Ruta para crear un nuevo post
app.post("/api/posts", (req, res) => {
  const { title, category, text, userId } = req.body;
  const date = new Date();
  const active = 1;

  const query = `
    INSERT INTO publicacion (titulo, contenido, fecha_creacion, usuario_id, categoria_id, activo)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [title, text, date, userId, category, active],
    (err, result) => {
      if (err) {
        console.error("Error al insertar el post:", err);
        return res.status(500).json({ message: "Error al crear el post" });
      }

      console.log("Post creado con éxito", result);
      res
        .status(201)
        .json({ message: "Post creado con éxito", postId: result.insertId });
    }
  );
});

app.get("/api/user/:userId", (req, res) => {
  const { userId } = req.params;
  db.query(
    "SELECT nombre, correo_electronico FROM usuario WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error al obtener los datos del usuario");
      } else {
        if (result.length > 0) {
          res.send(result[0]);
        } else {
          res.status(404).send("Usuario no encontrado");
        }
      }
    }
  );
});
