require('dotenv').config();
const express = require('express');
const app = express();
const puerto = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('El bot está despierto y vigilando.');
});

app.listen(puerto, () => {
    console.log(`Servidor fantasma escuchando en el puerto ${puerto}`);
});

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');

// Configuramos los permisos que necesita el bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildVoiceStates 
    ]
});

// Evento: Cuando el bot se enciende correctamente
client.on('ready', () => {
    console.log(`¡Bot encendido y listo para unirse a los Cuacks! Logueado como: ${client.user.tag}`);
});

// Evento: Cuando alguien escribe un mensaje
client.on('messageCreate', async (message) => {
    // Evitamos que el bot se responda a sí mismo
    if (message.author.bot) return;

    // ==========================================
    // COMANDO 1: !decir
    // ==========================================
    if (message.content.startsWith('!decir ')) {
        const textoALeer = message.content.replace('!decir ', '');
        const canalDeVoz = message.member?.voice?.channel;

        if (!canalDeVoz) {
            return message.reply('¡Metete a un canal de voz primero así te escucho!');
        }

        try {
            // 1. Transformamos el texto en audio
            const urlAudio = googleTTS.getAudioUrl(textoALeer, {
                lang: 'es', 
                slow: false,
                host: 'https://translate.google.com',
            });

            // 2. Revisamos si el bot YA ESTÁ en el canal para no hacer el ruido de entrar de nuevo
            let conexion = getVoiceConnection(message.guild.id);

            // Si no estaba, lo hacemos entrar
            if (!conexion) {
                conexion = joinVoiceChannel({
                    channelId: canalDeVoz.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
            }

            // === 🕵️‍♂️ INICIO DE LOS RAYOS X 🕵️‍♂️ ===
            conexion.on('stateChange', (oldState, newState) => {
                console.log(`[RED] Conexión de Discord: ${oldState.status} -> ${newState.status}`);
            });
            // ======================================

            // 3. Preparamos el reproductor y le mandamos el audio
            const reproductor = createAudioPlayer();

            // === 🕵️‍♂️ MÁS RAYOS X 🕵️‍♂️ ===
            reproductor.on('stateChange', (oldState, newState) => {
                console.log(`[AUDIO] Reproductor: ${oldState.status} -> ${newState.status}`);
            });

            reproductor.on('error', error => {
                console.error("¡ERROR DE AUDIO!", error.message);
            });
            // ======================================

            const recurso = createAudioResource(urlAudio);

            reproductor.play(recurso);
            conexion.subscribe(reproductor);

            message.react('🗣️');

        } catch (error) {
            console.error("Error general:", error);
            message.reply('Se me trabó la lengua. Hubo un error al generar la voz.');
        }
    }

    // ==========================================
    // COMANDO 2: !chau
    // ==========================================
    if (message.content === '!chau') {
        const conexionExistente = getVoiceConnection(message.guild.id);
        
        if (conexionExistente) {
            conexionExistente.destroy();
            message.reply('Nos vemos gente, me desconecto.');
        } else {
            message.reply('Pero si ni siquiera estoy en el canal de voz...');
        }
    }

});

// Conexión usando la variable de entorno
client.login(process.env.DISCORD_TOKEN);