import fs from 'node:fs/promises';
import path from 'node:path';
import { S1Store } from './store.mjs';

export class JsonS1Store extends S1Store {
  constructor({ filePath, memory = [], state = null } = {}) {
    super({ memory: state?.memory ?? memory });
    this.filePath = filePath;
    if (state) {
      this.traces = new Map(state.traces ?? []);
      this.quotaCounters = new Map(state.quotaCounters ?? []);
      this.idempotencyIndex = new Map(state.idempotencyIndex ?? []);
    }
  }

  static async open(filePath, options = {}) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return new JsonS1Store({ filePath, state: JSON.parse(raw), memory: options.memory });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const store = new JsonS1Store({ filePath, memory: options.memory ?? [] });
      await store.flush();
      return store;
    }
  }

  snapshot() {
    return {
      memory: this.memory,
      traces: [...this.traces.entries()],
      quotaCounters: [...this.quotaCounters.entries()],
      idempotencyIndex: [...this.idempotencyIndex.entries()],
    };
  }

  async flush() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, `${JSON.stringify(this.snapshot(), null, 2)}\n`, 'utf8');
  }
}
