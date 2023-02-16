# raknet-node
[![Build Status](https://img.shields.io/github/workflow/status/b23r0/raknet-node/Rust)](https://github.com/b23r0/raknet-node/actions/workflows/rust.yml)
[![NPM version](https://img.shields.io/npm/v/raknet-node.svg)](http://npmjs.com/package/raknet-node)
[![ChatOnDiscord](https://img.shields.io/badge/chat-on%20discord-blue)](https://discord.gg/ZKtYMvDFN4)

Nodejs bindings to rust-raknet native library.

# Install

```
npm install raknet-node
```

Prebuilds are provided for 64-bit Windows 10, Linux and OSX. If a prebuild does not work, please create an issue.

# Build

```sh
napi build --release
```

# Usage

## Compatible node-raknet-native

raknet-node provides the same set of interfaces as node-raknet-native, which you can use in a similar way. But they still have some differences. For example we have to require the first byte of the packet to be 0xfe.

```js
const { Client, Server, PacketPriority, PacketReliability } = require('raknet-node')
// The third paramater is for game type, you can specify 'minecraft' or leave it blank for generic RakNet
const client = new Client('127.0.0.1', 19130)
// hostname, port, serverOptions
const server = new Server('0.0.0.0', 19130)
server.listen()
client.connect()
client.on('encapsulated', (buffer) => {
  console.assert(buffer.cmp(Buffer.from([0xfe ,1, 2, 3])))
})

server.on('openConnection', (client) => {
  client.send(Buffer.from([0xfe ,1, 2, 3]), PacketPriority.HIGH_PRIORITY, PacketReliability.UNRELIABLE, 0)
})
```

## Asynchronous usage

The RaknetClient and RaknetServer classes are JS wrappers for the internal RaknetSocket and RaknetListener classes implemented in Rust in src/. All methods use asynchronous wrappers.


```js
const raknet = require('raknet-node')
const assert = require('assert');

async function main(){
	address = "127.0.0.1:19132"
	server = await raknet.RaknetServer.bind(address)
	console.log("bind to : " + address)
	
	client1 = await raknet.RaknetClient.connect(address)

	console.log("connect to : " + address + " success")

	client2 = await server.accept()

	await client1.send(Buffer.from([0xfe ,1, 2, 3]))
	await client2.send(Buffer.from([0xfe ,1, 2, 3]))

	buf1 = await client1.recv()
	buf2 = await client2.recv()

	assert(buf1.compare(buf2) == 0)

	return "finished"
}

main()
 .then(console.log)
 .catch(console.error)
```

# Lisence

MIT - https://github.com/b23r0/raknet-node/blob/main/LICENSE