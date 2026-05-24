require('dotenv').config();

// 🪄 MAGIA PARA RENDER: Forzamos a que use el internet tradicional (IPv4)
// porque Render a veces se hace un nudo con IPv6 y los canales de Discord.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

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
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildVoiceStates 
    ]
});

// Evento: Cuando el bot se enciende correctamente (Actualizado a clientReady)
client.on('clientReady', () => {
    console.log(`¡Bot encendido y listo para unirse a los Cuacks! Logueado como: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
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
            const urlAudio = googleTTS.getAudioUrl(textoALeer, {
                lang: 'es', 
                slow: false,
                host: 'https://translate.google.com',
            });

            let conexion = getVoiceConnection(message.guild.id);

            if (!conexion) {
                conexion = joinVoiceChannel({
                    channelId: canalDeVoz.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });

                // 🛡️ ESCUDO: Si Render tiene un micro-corte de red, lo atrapamos y el bot sigue vivo.
                conexion.on('error', error => {
                    console.error("Micro-corte de red ignorado:", error.message);
                });
            }

            const reproductor = createAudioPlayer();

            reproductor.on('error', error => {
                console.error("¡ERROR DE AUDIO!", error.message);
            });

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

client.login(process.env.DISCORD_TOKEN);