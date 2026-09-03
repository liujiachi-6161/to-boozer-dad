import { kv } from "@vercel/kv";

export default async function handler(req) {
  if (req.method === "PUT") {
    try {
      const payload = await req.json();
      await kv.set("sportTeacherData", payload);
      return new Response(JSON.stringify({ ok: true, msg: "上传成功" }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, msg: "KV写入失败:" + e.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  if (req.method === "GET") {
    try {
      const data = await kv.get("sportTeacherData");
      return new Response(JSON.stringify({ ok: true, data: data || { records: {} } }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, msg: "KV读取失败:" + e.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return new Response(JSON.stringify({ ok: false, msg: "请求方式不支持" }), {
    headers: { "Content-Type": "application/json" }
  });
}