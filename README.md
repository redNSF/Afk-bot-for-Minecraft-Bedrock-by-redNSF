
# Afk Server bot for Minecraft Bedrock edition by redNSF

![GitHub forks](https://img.shields.io/github/forks/redNSF/Afk-bot-for-Minecraft-Bedrock?style=social)
![GitHub Repo stars](https://img.shields.io/github/stars/redNSF/Afk-bot-for-Minecraft-Bedrock?style=social)
This bot logs into your Minecraft Bedrock edition server to keep your server online. This bot supports the latest version of Minecraft. It's really easy to setup. Also this bot has bot online and offline feature. With online feature the bot will join with a microsoft account given by you (Highly recommend this option cz it helps to keep your server secured)

For servers, use the bot.js. Change the host and port. For offline mode, you can set your own username. If you want online mode, set "offline" to "false" (recommended to delete realm.js)

For realms, use the realm script (recommended to delete bot.js) make sure the bot account has only one joined realm or in case you have multiple realms then check the corresponding number in your realm list. The first one can be counted as 0. Then change the index in realms[0] (change the 0 to the corresponding index)



## Features

- Supports Minecraft Bedrock version 1.16.201, 1.16.210, 1.16.220, 1.17.0, 1.17.10, 1.17.30, 1.17.40, 1.18.0, 1.18.11, 1.18.30, 1.19.1, 1.19.10, 1.19.20, 1.19.21, 1.19.30, 1.19.40, 1.19.41, 1.19.50, 1.19.60
- Autheticate clients with Xbox Live
- Offline Mode
- Can join realms


## Installation

First Install bedrock-protocol with npm


```bash
  npm install bedrock-protocol
```
    
## Deployment

To deploy this project run

```bash
  node bot.js
```


## Screenshots

![App Screenshot](https://i.imgur.com/SjhqwDw.png)


## Related

Here are some related projects

[Bedrock Protocol](https://github.com/PrismarineJS/bedrock-protocol)

