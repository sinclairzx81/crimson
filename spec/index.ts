// tslint:disable

import { Actor, Receiver, Sender, System } from "../src/index"

import { expect } from "chai"

export class A implements Actor<string> {
  public run(sender: Sender<string>, receiver: Receiver<string>) {
    receiver.on((from, value) => sender.send("B", value))
  }
}

export class B implements Actor<string> {
  public run(sender: Sender<string>, receiver: Receiver<string>) {
    receiver.on((from, value) => sender.send("C", value))
  }
}

export class C implements Actor<string> {
  public run(sender: Sender<string>, receiver: Receiver<string>) {
    receiver.on((from, value) => sender.send("System", value))
  }
}


describe("System", () => {
  // System > A > B > C > System
  it("should complete echo responder test", () => new Promise<void>((resolve, _) => {
    const system = new System<string>("System")
    system.mount("A", new A())
    system.mount("B", new B())
    system.mount("C", new C())

    const [sender, receiver] = system.start()
    sender.send("A", "echo-test")
    receiver.on((from, value) => {
      system.stop()
      expect(from).to.eq("C")
      expect(value).to.eq("echo-test")
      resolve()
    })
  }))
})
