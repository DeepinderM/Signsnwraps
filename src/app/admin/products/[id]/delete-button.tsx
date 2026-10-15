"use client";

import { useState } from "react";
import { deleteProduct } from "../actions";

export function DeleteProductButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  return <form action={deleteProduct} className="admin-danger">
    <input type="hidden" name="id" value={id} />
    {confirming
      ? <><span>Delete this product permanently? Past orders keep their own copy of the details.</span><button className="button admin-delete" type="submit">Yes, delete</button><button className="button button-light" type="button" onClick={() => setConfirming(false)}>Cancel</button></>
      : <button className="button button-light" type="button" onClick={() => setConfirming(true)}>Delete product…</button>}
  </form>;
}
