# crimson

Actor systems in JavaScript.

```typescript
import { Actor, Receiver, Sender, System } from "./crimson"

export class Increment implements Actor<number> {
  public run(sender: Sender<number>, receiver: Receiver<number>) {
    receiver.on((from, value) => sender.send(from, value + 1))
  }
}

export class Decrement implements Actor<number> {
  public run(sender: Sender<number>, receiver: Receiver<number>) {
    receiver.on((from, value) => sender.send(from, value - 1))
  }
}

const system = new System<number>("system")
system.mount("Increment", new Increment())
system.mount("Decrement", new Decrement())

const [sender, receiver] = system.start()
sender.send("Decrement", 10)
sender.send("Increment", 10)
receiver.on((from, value) => {
  console.log(from, value)
})

```
### overview

crimson is a small javascript library to allow one to create concurrent systems with actors. It provides a minimal interface in which to setup and run actors over a unifying message type `T` with the `system` type facilitating message routing between actors.  

# tasks

The following tasks are supported

```
npm run clean # cleans this project.
npm run build # builds this project to ./bin.
npm run spec  # executes specification for this project.
npm run start # runs ./src/index.ts in watch mode.
npm run lint  # lints this project
```