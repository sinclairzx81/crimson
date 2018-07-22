/*--------------------------------------------------------------------------

crimson - Actor systems in JavaScript

The MIT License (MIT)

Copyright (c) 2018 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import { channel, Receiver as ChannelReceiver, Sender as ChannelSender } from "./channel"

/** internal delay function used during message processing */
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * SystemMessage<T>
 *
 * Represents an internal system message sent between actors.
 * This message is constructed by the actors sender type and
 * is received by the system which uses the from and to
 * properties to route to recipient actor queue.
 */
interface SystemMessage<T> {
  from: string
  to: string
  value: T
}

/**
 * Sender<T>
 *
 * Specialized sender type for actors. Passed into an actors
 * run method; the sender is responsible for providing an
 * extended send interface over a standard sender, and for
 * constructing underlying system messages used for routing
 * within the system type.
 */
export class Sender<T> {
  constructor(private address: string, private sender: ChannelSender<SystemMessage<T>>) { }
  public send(to: string, value: T) {
    setTimeout(() => this.sender.send({from: this.address, to, value}), 1)
  }
}

/**
 * Receiver<T>
 *
 * Specialized actor receiver type. Passed into an actors
 * run method; the receiver is reponsible for providing an
 * extended message receiver interface, allowing a actor
 * to learn of the "source" of a message.
 */
export class Receiver<T> {
  constructor(private address: string, private receiver: ChannelReceiver<SystemMessage<T>>) {
    this.receiver.on((message) => this.func(message.from, message.value))
  }
  public on(func: (from: string, value: T) => void): void {
    this.func = func
  }

  private func: (from: string, value: T) => void = (_0, _1) => { /* */ }
}

/**
 * Actor<T>
 *
 * A common interface given to all actors to implement. The
 * interface expects a run(sender, receiver) function to be
 * implemented by the actor with the run(..) function called
 * exactly once when a system is started. Actors may choose
 * to subscribe on the receiver provided, or start interval
 * loops on their own. The sender type allows the actor to
 * push messages to other actors in the system.
 */
export interface Actor<T> {
  run(sender: Sender<T>, receiver: Receiver<T>)
}

/**
 * System<T>
 *
 * A top level system type. The system allows a caller to
 * mount many actors (with named addresses), which can be
 * started as a group. The system is also responsible for
 * routing messages between actors hosted on the system,
 * as well as returning a sender, receiver pair for the
 * system to send and receive messages from actors in the
 * system.
 */
export class System<T> {
  private messages: Map<string, Array<SystemMessage<T>>>
  private actors: Map<string, Actor<T>>
  private started: boolean

  /** creates a new system with the given name. */
  constructor(private address: string = "system") {
    this.messages = new Map()
    this.messages.set(address, [])
    this.actors = new Map()
    this.started = false
  }

  /** mounts an actor at the given address. */
  public mount(address: string, actor: Actor<T>): void {
    this.actors.set(address, actor)
    this.messages.set(address, [])
  }

  /** starts this system and returns a sender. */
  public start(): [Sender<T>, Receiver<T>] {
    this.started = true
    this.start_actors()
    return this.start_system()
  }

  /** stops this system */
  public stop() {
    this.started = false
  }

  /** starts the system actor. */
  private start_system(): [Sender<T>, Receiver<T>] {
    const [tx0, rx0] = channel<SystemMessage<T>>()
    const [tx1, rx1] = channel<SystemMessage<T>>()
    rx0.on((message) => {
      if (this.messages.has(message.to)) {
        this.messages.get(message.to).push(message)
      }
    })
    setTimeout(async () => {
      const messages = this.messages.get(this.address)
      while (this.started) {
        await delay(1)
        while (messages.length > 0) {
          tx1.send(messages.shift())
        }
      }
    }, 1)
    const sender = new Sender(this.address, tx0)
    const recevier = new Receiver(this.address, rx1)
    return [sender, recevier]
  }
  /** starts all actors. */
  private start_actors() {
    const addresses = this.actors.keys()
    for (const address of addresses) {
      const actor = this.actors.get(address)
      const [tx0, rx0] = channel<SystemMessage<T>>()
      const [tx1, rx1] = channel<SystemMessage<T>>()
      rx0.on((message) => {
        if (this.messages.has(message.to)) {
          this.messages.get(message.to).push(message)
        }
      })
      actor.run(new Sender<T>(address, tx0), new Receiver<T>(address, rx1))
      setTimeout(async () => {
        const messages = this.messages.get(address)
        while (this.started) {
          await delay(1)
          while (messages.length > 0) {
            tx1.send(messages.shift())
          }
        }
      }, 1)
    }
  }
}
