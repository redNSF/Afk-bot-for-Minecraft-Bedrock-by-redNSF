
const { MessageID, PacketReliability, PacketPriority } = require('./constants.js')
var sha1 = require('sha1');

try{

  switch (process.platform) {
    case "win32":
      var { RaknetClient, RaknetServer , enablelog } = require('./raknet-node-win.node')
      break;
    case "linux":
      var { RaknetClient, RaknetServer } = require('./raknet-node-linux.node')
      break;
	default :
	  console.log('[raknet] need to build')
	  process.exit(1)
  }
} catch (e) {
	console.log(e)
	console.log('[raknet] need to build')
	process.exit(1)
}

function listen(server , cb) {

	const doSomething = async () => {
		for (;;){
			try{
				cb(await server.accept())
			} catch{
				break
			}
			
		}
	}
	doSomething().then(null)
}

function recvcb(client , cb) {
	client.recv().then((buf) => {
		if (cb(buf)){
			recvcb(client , cb)
		}
	}).catch((e) => {
		cb(null)
	})
}

function connectcb(address , cb){
	RaknetClient.connect(address).then((client) =>{
		cb(client)
	})
}

const { EventEmitter } = require('events')

class Client extends EventEmitter {
  constructor (hostname, port, options = {}) {
    super()
	
	this.ping = () => {
		RaknetClient.ping(hostname + ":" + port).then((motd) => {
			this.emit('pong', { extra: motd })
		})
	 }
	
	this.client = null
    this.connect = () => {
		connectcb(hostname + ":" + port, (client) => {
			this.client = client
			var address = this.client.peeraddr()
		
			this.emit('connect', { address })
			recvcb(this.client , (buf) => {
				if (buf == null){
					this.emit('disconnect', { address })
					return false
				}
				this.emit('encapsulated', { buffer: buf, address })
				return true
			})
		})
	}
    this.close = () => {
		if (this.client != null) {
			this.client.close()
		}
	}
  }

  send (message) {
    this.client.send(message).then(() => {}).catch(e => console.log)
  }
}

function ServerClient (server, address, client) {
  const [hostname, port] = address.split(':')
  this.address = address
  this.client = client
  this.server = server
  this.send = (...args) => this.client.send(...args)
  this.close = () => {
	this.server.kick(sha1(this.address))
	this.client.close()
  }

  this.neuter = () => { // Client is disconnected, no-op to block sending
    this.send = () => { }
  }
}

class Server extends EventEmitter {
  constructor (hostname, port) {
    super()
	this.server = null
	this.clients = new Map()
    this.listen = () => {
		
		RaknetServer.bind(hostname + ":" + port).then((server) => {
			this.server = server
			listen(server, (client) => {
				var address = client.peeraddr()
				const new_client = new ServerClient(this, client.peeraddr() , client)
				this.emit('openConnection', new_client)

				this.clients.set(sha1(address) , client)

				recvcb(client , (buf) => {
					if (buf == null){
						this.emit('closeConnection', { address , guid : sha1(address) })
						this.clients.delete(sha1(address))
						return false
					} else {
						this.emit('encapsulated', { buffer: buf, address : client.peeraddr()})
						return true
					}
				})
			})
		})
	}
  }
  close() {
	if (this.server != null)
	this.server.close()
  }
  
  setOfflineMessage (message) {
    if (message instanceof Buffer) message = message.toString()
	if (this.server) this.server.setmotd(message)
  }
  
  kick (clientGuid) {
	var client = this.clients.get(clientGuid)
	if (client) client.close()
	this.clients.delete(clientGuid)
  }

}

module.exports = { RaknetClient, RaknetServer, Server, Client , MessageID, PacketPriority, PacketReliability}