require('dotenv').config();
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

            // 3. Preparamos el reproductor y le mandamos el audio
            const reproductor = createAudioPlayer();
            const recurso = createAudioResource(urlAudio);

            reproductor.play(recurso);
            conexion.subscribe(reproductor);

            message.react('🗣️');

        } catch (error) {
            console.error("Error al reproducir el audio:", error);
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

// ¡Reemplazá esto con tu Token real!
client.login(process.env.DISCORD_TOKEN);