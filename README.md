# Courier - RediGraph Flavor
## A logless Secure Messaging Courier made with Redis & GraphQL

## Using **Redis & GraphQL**

Redis is clean and lightweight, you can easily use any version with this package. In production, ensure it's diligantly configured, with dangerous commands disabled. 

This project only uses these commands: `get`, `set`, `publish`, `subscribe` & `expire`. I recommend whitelisting those commands only. And hard drive persistence will only hurt the drive & provide no real benefit in this context. 

The project is quite lean, as it doesn't need to do much, just a lot of the same thing quickly. Here is the [NodeJS client we use for Redis](https://www.npmjs.com/package/ioredis).

GraphQL has so many great uses, it's really hard to limit them to just React. That's why you're seeing it used here.

## Attribution

Special thanks to [@nowke](https://github.com/nowke/) for writing [an amazing article](https://medium.com/@nowke/building-a-real-time-dashboard-using-react-graphql-subscriptions-and-redis-pubsub-49f5e391a4f9) & [providing some sample code](https://github.com/nowke/realtime-dashboard-demo/), which I gutted & hacked to pieces. 

Still, I used it as a place to start without forking it, so I wanted to give credit where credit is due. I found that [@nowke's realitme dashboard project]((https://github.com/nowke/realtime-dashboard-demo/)) follows great practices and has accurate mocking of test subscription data that relates well for most users (CPU & Memory usage). The article talks through doing the mocking very well. However, you'll find that goodness is entirely missing from the current project.

## Getting Started

**Start Redis server**

```
redis-server
```

**Install dependencies**

```
cd server
yarn install
```

**Start the server**

```
yarn start
```

Server will be running at [http://localhost:4000/](http://localhost:4000/). 


## "Examples"

Note the quotes as they're not complete or fully usable yet and you probably don't want to be encrypting in the browser.

However the examples have full queries and readable patterns.

So the [_"Examples"_](examples/) serve mostly as documentation for now.

### How is it logless? - Privacy First

Well I mean, we have to store the encrypted message for a short time, so Redis seemed like the best place. Only special message, like invite codes, are stored longer than 1 minute. Special messages have a 10-15 minute TTL & are very likely removed before that. Redis can even disable persisitence so that nothing ever leaves server memory.

So when I say logless, I mean messages & generated unique user identification information is not stored longer than is needed to pass it from one user to another. After the key exchange, the Courier can only pass encrypted messages, which are only readable by the memebers of the conversation. Just like how an Uber driver would never look in your baggage. Similarly in E2E messaging, Courier doesn't have any opportunity to read what's really inside, and it's still securely delivered to the destination.

### Redis "Schema"

Each message is keyed in Redis like `threadId:sessionId` (sessionId represents a user) so this design means only one message per user/thread can exist, if the user sends another message the previous message is wiped. By then the other user's subscription has likely picked it up by then. The solution is to send message less frequently over slower connections. And if possibly avoid sending double messages, which is just polite anyway.

### Security

There is a way to extend this pattern using stubs. However, it provides an attack surface for one user to send mass amounts of data. Thereby, causing us to reduce throttling limits & make them more obvious/painful to users. If we want to worry about attack surfaces, let's limit them to DDOS, instead of a DOS crack in the wall that says "kick me". Throttling is bad enough.

There is a Postgraphile Flavor coming too, which will provide more reliablitiy/persistence. But with added complexity means added vulerability.

### Simplicity

Simplicity is best way to keep this free & open, yet still both secure & private. No logging, less validation, protecting the private space between users, even from ourselves. There is no authentication planned since all users are free & equal, but this can easily be run inside a VPN to limit the list of users who have access (like an entire company or even a home router).

### Future

That said, until I publish Android, Windows, Linux, Mac, maybe iOS, clients to provide context, this project is still fairly useless. It can currently only be used to pass non-encrypted messages or learn about GraphQL & Redis, because of it's reliance of doing encryption in clients only. It can also provide a place to start when building on another platform/language.

If you're interested in helping with client development open an issuse and title it like "Help - Mac Client".

