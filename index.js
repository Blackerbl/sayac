require('dotenv').config();
const { Client, Intents, MessageEmbed } = require('discord.js');
const schedule = require('node-schedule');
const fs = require('fs');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const token = process.env.TOKEN;
const targetChannelId = process.env.TARGET_CHANNEL_ID;
const logChannelId = process.env.LOG_CHANNEL_ID;

let userPoints = JSON.parse(fs.readFileSync('points.json', 'utf8'));
let allTimePoints = JSON.parse(fs.readFileSync('allTimePoints.json', 'utf8'));

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  schedule.scheduleJob('0 0 * * 0', () => {
    logAndResetPoints();
  });
});

client.on('messageCreate', (message) => {
  if (message.channel.id === targetChannelId && containsInviteLink(message.content)) {
    const userId = message.author.id;

    if (!userPoints[userId]) {
      userPoints[userId] = 0;
    }
    if (!allTimePoints[userId]) {
      allTimePoints[userId] = 0;
    }

    userPoints[userId] += 1;
    allTimePoints[userId] += 1;

    const embed = new MessageEmbed()
      .setColor('#00FF00')
      .setTitle('Partner Baarl!')
      .setDescription(` Yeni partner için teekkürler <@${userId}>! \n Partner yaparak 1 puan kazandnz. u anki toplam puannz: ${userPoints[userId]} `);

    message.reply({ embeds: [embed] });
    fs.writeFileSync('points.json', JSON.stringify(userPoints, null, 2));
    fs.writeFileSync('allTimePoints.json', JSON.stringify(allTimePoints, null, 2));
  }

  if (message.content.startsWith('!puan')) {
    const userMention = message.mentions.users.first();
    const userId = userMention ? userMention.id : message.author.id;
    const userAvatarURL = userMention ? userMention.displayAvatarURL() : message.author.displayAvatarURL();

    const weeklyPoints = userPoints[userId] || 0;
    const totalPoints = allTimePoints[userId] || 0;

    const weeklyRank = Object.keys(userPoints).sort((a, b) => userPoints[b] - userPoints[a]).indexOf(userId) + 1;
    const totalRank = Object.keys(allTimePoints).sort((a, b) => allTimePoints[b] - allTimePoints[a]).indexOf(userId) + 1;

    const embed = new MessageEmbed()
      .setColor('#00FF00')
      .setTitle('Puan Durumu')
      .setDescription(`
             \n <@${userId}> için partner durumu;\n:**Haftalk Puan:** ${weeklyPoints}\n **Haftalk Sralama:** ${weeklyRank}\n**Toplam Puan:** ${totalPoints}\n:**Toplam Sralama:** ${totalRank}\n        `)
      .setThumbnail(userAvatarURL);

    message.reply({ embeds: [embed] });
  }
});

function containsInviteLink(message) {
  const inviteLinkPattern = /\b(?:https?:\/\/)?(?:www\.)?(?:discord(?:\.com|app\.com|\.gg)\/invite\/)?[a-zA-Z0-9-]{2,32}\b/gi;
  return inviteLinkPattern.test(message);
}

function logAndResetPoints() {
  const logChannel = client.channels.cache.get(logChannelId);

  if (logChannel) {
    let weeklyRanking = 'Haftalk Puan Durumu:\n';
    for (const [userId, points] of Object.entries(userPoints)) {
      weeklyRanking += `<@${userId}>: ${points} puan\n`;
    }

    let allTimeRanking = 'Tüm Zamanlarn Puan Durumu:\n';
    for (const [userId, points] of Object.entries(allTimePoints)) {
      allTimeRanking += `<@${userId}>: ${points} puan\n`;
    }

    const weeklyEmbed = new MessageEmbed()
      .setColor('#FFA500')
      .setTitle('Haftalk Partner Durumu')
      .setDescription(weeklyRanking);

    const allTimeEmbed = new MessageEmbed()
      .setColor('#0000FF')
      .setTitle('Tüm Zamanlarn Partner Durumu')
      .setDescription(allTimeRanking);

    logChannel.send({ embeds: [weeklyEmbed, allTimeEmbed] });

    userPoints = {};
    fs.writeFileSync('points.json', JSON.stringify(userPoints, null, 2));
  }
}

client.login(token);