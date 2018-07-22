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

/**
 * Sender<T>
 *
 * A sender side of a channel pair. The sender is responsible
 * for sending a message of type T to a recipient receiver.
 */
export interface Sender<T> {

  send(value: T): void
}

/**
 * Receiver<T>
 *
 * A receiver side of a channel pair. The receiver is
 * responsible for receiving messages sent from a
 * sender. A receiver is a subscribe once interface,
 * with multiple calls to on() overwriting the previous
 * handler.
 */
export interface Receiver<T> {

  /** subscribes to messages from the channel. */
  on(func: (value: T) => void): void
}

/**
 * ChannelSender<T>
 *
 * An internal implementation of a Sender<T>, this type
 * is created by way of calling the channel function.
 */
class ChannelSender<T> implements Sender<T> {
  constructor(private func: (value: T) => void) {}

  /** Sends the given message to the channel. */
  public send(value: T): void {
    this.func(value)
  }
}

/**
 * ChannelReceiver<T>
 *
 * An internal implementation of a Receiver<T>, this type
 * is created by way of calling the channel function.
 */
class ChannelReceiver<T> implements Receiver<T> {
  private subscribed: boolean = false
  public on(func: (value: T) => void): void {
    if (this.subscribed === false) {
      this.func = func
    } else {
      throw Error("cannot subscribe to a receiver more than once.")
    }
  }
  public dispatch(value: T) {
    this.func(value)
  }

  // tslint:disable-next-line
  private func: (value: T) => void = (_) => { /* */ }
}

/**
 * channel<T>
 *
 * Creates a uni-directional send / receive interface;
 * returning the sender and receiver pairs of the
 * channel.
 */
export const channel = <T>(): [Sender<T>, Receiver<T>] => {
  const receiver = new ChannelReceiver<T>()
  const sender   = new ChannelSender<T>((value) => receiver.dispatch(value))
  return [sender, receiver]
}
