import express from 'express'
import dotenv from 'dotenv'
import conectarDB from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js'
import proyectoRoutes from './routes/proyectoRoutes.js'
import tareaRoutes from './routes/tareasRoutes.js'
import cors from 'cors'

const app = express()
app.use(express.json())

// Ocultar base de datos con env
dotenv.config()

// Conectar la base de datos
conectarDB();

// Configurar cors para poder conectar el back con el front
const whiteList = [process.env.FRONTEND_URL]

// Configurar cors
const corsOptions = {
    origin: function (origin, callback) {
        if (whiteList.includes(origin)) {
            // Puede consultar la api
            callback(null, true)
        } else {
            // No esta permitido 
            callback(new Error('Error de cors'))
        }
    }
}

app.use(cors(corsOptions))

// Routing
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proyectos", proyectoRoutes);
app.use("/api/tareas", tareaRoutes);


// Variable de entorno para el host
const PORT = process.env.PORT || 4000

const servidor = app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}`);
})

// Socket oi
import { Server } from "socket.io";

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,
    },
});

io.on("connection", (socket) => {
    // console.log("Conectado a socket.io");

    // Definir los eventos de socket io
    socket.on("abrir proyecto", (proyecto) => {
        socket.join(proyecto);
    });

    socket.on("nueva tarea", (tarea) => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea agregada", tarea);
    });

    socket.on('eliminar tarea', (tarea) => {
        const proyecto = tarea.proyecto
        socket.to(proyecto).emit('tarea eliminada', tarea)
    })

    socket.on('actualizar tarea', tarea => {
        const proyecto = tarea.proyecto._id

        socket.to(proyecto).emit('tarea actualizada', tarea)
    })

    socket.on('cambiar estado', (tarea) => {
        const proyecto = tarea.proyecto._id
        socket.to(proyecto).emit('nuevo estado', tarea)
    })
})

