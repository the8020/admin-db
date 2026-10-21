import { assertEquals } from "@std/assert";
import { authDatabase } from "/p/the8020/auth/src/test_support.ts";
import { MessageHistory } from "/p/the8020/uui/messages.ts";
import { bindSession, type SessionChannel } from "/p/the8020/uui/internal.ts";
import type {
  UUIClientMessage,
  UUIWorkerOutbound,
} from "/p/the8020/uui/mod.ts";

/** A session that records output and never sends client events. */
class QuietChannel implements SessionChannel {
  readonly sessionId = "admin-db-permission-test";
  readonly messageHistory = new MessageHistory();
  readonly sent: UUIWorkerOutbound[] = [];
  send(message: UUIWorkerOutbound): void {
    this.sent.push(message);
  }
  receive(): Promise<UUIClientMessage> {
    return new Promise(() => {});
  }
}

Deno.test("SQL executor and table browser report missing permissions", async () => {
  const fixture = await authDatabase();
  const { default: sqlExecutor } = await import("./program.ts");
  const { default: browseTable } = await import("../browse/program.ts");
  const users = await import("/p/the8020/users/src/admin.ts");
  const channel = new QuietChannel();
  const unbind = bindSession(channel);
  try {
    await users.add("alice");
    fixture.asUser("alice");
    // Both return without presenting a screen.
    await sqlExecutor();
    await browseTable("orders");
    const messages = channel.messageHistory.snapshot().map((item) =>
      (item as { text?: string; message?: string }).text ??
        (item as { message?: string }).message ?? JSON.stringify(item)
    );
    assertEquals(
      messages.some((text) =>
        text.includes("Permission denied: the8020.admin-db.sql.execute")
      ),
      true,
    );
    assertEquals(
      messages.some((text) =>
        text.includes("Permission denied: the8020.admin-db.table.view")
      ),
      true,
    );
    assertEquals(
      channel.sent.some((message) => message.type === "presentation.show"),
      false,
    );
  } finally {
    unbind();
    fixture.close();
  }
});
