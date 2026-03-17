/**
 * Generic object pool.
 * Objects must have an `active` boolean property.
 * When active becomes false, the pool reclaims them on the next update().
 */
export class ObjectPool {
  constructor(factory, initialSize = 20) {
    this._factory = factory;
    this._pool    = [];
    this.active   = [];

    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  /** Get a fresh (or recycled) object and mark it active. */
  get() {
    const obj = this._pool.length ? this._pool.pop() : this._factory();
    this.active.push(obj);
    return obj;
  }

  /** Return an object to the pool. */
  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) this.active.splice(idx, 1);
    this._pool.push(obj);
  }

  /** Update all active objects and reclaim inactive ones. */
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.active[i].update(dt);
      if (!this.active[i].active) {
        this.release(this.active[i]);
        i = Math.min(i, this.active.length - 1);
      }
    }
  }

  /** Draw all active objects. */
  draw(ctx) {
    for (const obj of this.active) obj.draw(ctx);
  }

  /** Deactivate and reclaim everything. */
  releaseAll() {
    while (this.active.length) {
      this.active[0].active = false;
      this.release(this.active[0]);
    }
  }

  get count() { return this.active.length; }
}
