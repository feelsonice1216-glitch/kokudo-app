import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Home, LayoutGrid, List as ListIcon, BarChart3, Settings, Search,
  Star, MapPin, Navigation, Plus, X, Download, Upload, Trash2,
  CalendarDays, Store, Check, RotateCcw, Locate, Images, Bell
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

/* ------------------------------------------------------------------ */
/*  定数                                                                */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'kokudo-data-v2';
const REGIONS = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄'];
const METHODS = ['現地購入', 'イベント', '通販', 'その他'];

const uid = () => Math.random().toString(36).slice(2, 10);

/* 2点間の距離(km)をハヴァサイン公式で計算 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* 現在地を取得する共通フック */
function useMyLocation() {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) { setError('この端末では位置情報を利用できません'); return; }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      (err) => { setError('現在地を取得できませんでした（位置情報の許可を確認してください）'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  return { pos, error, loading, locate };
}

/* ------------------------------------------------------------------ */
/*  シードデータ                                                        */
/*  ステッカー(sticker)＝国道番号ごとに1件。                             */
/*  販売店(shop)＝そのステッカーを扱う店。1ステッカーに複数店が紐づく。    */
/* ------------------------------------------------------------------ */

const seedCombined = [
  { routeNumber: 1, name: '国道1号線', region: '関東', releaseDate: '2019-04-01', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-03-02', method: '現地購入', price: 500, rating: 4, favorite: true, memo: '富士山がきれいに見えた',
    acquiredShopIndex: 0,
    shops: [
      { name: '道の駅 箱根峠', address: '神奈川県足柄下郡箱根町', prefecture: '神奈川県', lat: 35.2323, lng: 139.0257, mapUrl: 'https://maps.google.com', businessHours: '9:00-17:00', closedDays: '年中無休', wantToVisit: false, revisit: false, stockChecks: [{ date: '2026-07-15', note: '在庫あり（残り多数）' }], shopImageUrl: '' },
      { name: '足柄サービスエリア（上り）', address: '静岡県駿東郡小山町', prefecture: '静岡県', lat: 35.3324, lng: 138.9500, mapUrl: 'https://maps.google.com', businessHours: '24時間', closedDays: '', wantToVisit: true, revisit: false, stockChecks: [], shopImageUrl: '' },
    ] },
  { routeNumber: 15, name: '国道15号線', region: '関東', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-04-10', method: 'イベント', price: 400, rating: 3, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '横浜土産センター', address: '神奈川県横浜市', prefecture: '神奈川県', lat: 35.4437, lng: 139.6380, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 246, name: '国道246号線', region: '中部', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-05-01', method: '現地購入', price: 500, rating: 5, favorite: true, memo: '再入荷したらまた買う',
    acquiredShopIndex: 0,
    shops: [{ name: 'サービスエリア沼津', address: '静岡県沼津市', prefecture: '静岡県', lat: 35.0955, lng: 138.8636, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: true, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 20, name: '国道20号線', region: '中部', releaseDate: '', notes: '未訪問', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 信州蔦木宿', address: '長野県富士見町', prefecture: '長野県', lat: 35.8968, lng: 138.3220, mapUrl: 'https://maps.google.com', businessHours: '8:30-18:00', closedDays: '', wantToVisit: true, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 8, name: '国道8号線', region: '中部', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 豊栄', address: '新潟県新潟市', prefecture: '新潟県', lat: 37.9161, lng: 139.3183, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 9, name: '国道9号線', region: '近畿', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-02-14', method: '通販', price: 450, rating: 3, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 京丹波', address: '京都府船井郡京丹波町', prefecture: '京都府', lat: 35.2333, lng: 135.3667, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 2, name: '国道2号線', region: '近畿', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-06-20', method: '現地購入', price: 500, rating: 4, favorite: true, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 みなとオアシス神戸', address: '兵庫県神戸市', prefecture: '兵庫県', lat: 34.6901, lng: 135.1955, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 176, name: '国道176号線', region: '近畿', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 但馬長寿の郷', address: '兵庫県朝来市', prefecture: '兵庫県', lat: 35.3103, lng: 134.8371, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 29, name: '国道29号線', region: '中国', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 若桜', address: '鳥取県八頭郡若桜町', prefecture: '鳥取県', lat: 35.3486, lng: 134.4048, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 2, name: '国道2号線（広島）', region: '中国', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-01-11', method: '現地購入', price: 500, rating: 4, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 湯来交流体験センター', address: '広島県広島市', prefecture: '広島県', lat: 34.5591, lng: 132.3672, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 11, name: '国道11号線', region: '四国', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 津田の松原', address: '香川県さぬき市', prefecture: '香川県', lat: 34.3397, lng: 134.2564, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 32, name: '国道32号線', region: '四国', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-07-03', method: 'イベント', price: 400, rating: 5, favorite: true, memo: '大歩危峡がすごかった',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 大歩危', address: '高知県土佐郡大豊町', prefecture: '高知県', lat: 33.8617, lng: 133.7999, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 3, name: '国道3号線', region: '九州・沖縄', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-05-28', method: '現地購入', price: 500, rating: 4, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 むなかた', address: '福岡県宗像市', prefecture: '福岡県', lat: 33.8067, lng: 130.5397, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 57, name: '国道57号線', region: '九州・沖縄', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 阿蘇', address: '熊本県阿蘇市', prefecture: '熊本県', lat: 32.9564, lng: 131.0873, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: true, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 58, name: '国道58号線', region: '九州・沖縄', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-07-20', method: '現地購入', price: 500, rating: 5, favorite: true, memo: '海がきれいだった',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 許田', address: '沖縄県名護市', prefecture: '沖縄県', lat: 26.5764, lng: 128.0164, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 5, name: '国道5号線', region: '北海道', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-06-05', method: '通販', price: 450, rating: 3, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 ニセコビュープラザ', address: '北海道虻田郡ニセコ町', prefecture: '北海道', lat: 42.8048, lng: 140.6874, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 44, name: '国道44号線', region: '北海道', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 摩周温泉', address: '北海道川上郡弟子屈町', prefecture: '北海道', lat: 43.5217, lng: 144.4508, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 4, name: '国道4号線', region: '東北', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-04-29', method: '現地購入', price: 500, rating: 4, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 上品の郷', address: '宮城県石巻市', prefecture: '宮城県', lat: 38.4342, lng: 141.3033, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 7, name: '国道7号線', region: '東北', releaseDate: '', notes: '', imageUrl: '',
    acquired: false, acquiredDate: '', method: '', price: '', rating: 0, favorite: false, memo: '',
    shops: [{ name: '道の駅 岩城', address: '秋田県由利本荘市', prefecture: '秋田県', lat: 39.3814, lng: 140.0503, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
  { routeNumber: 13, name: '国道13号線', region: '東北', releaseDate: '', notes: '', imageUrl: '',
    acquired: true, acquiredDate: '2026-03-18', method: 'イベント', price: 400, rating: 3, favorite: false, memo: '',
    acquiredShopIndex: 0,
    shops: [{ name: '道の駅 尾花沢', address: '山形県尾花沢市', prefecture: '山形県', lat: 38.6017, lng: 140.3933, mapUrl: 'https://maps.google.com', businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '' }] },
];

function buildSeed() {
  const stickers = [];
  const shops = [];
  seedCombined.forEach(entry => {
    const stickerId = uid();
    const shopIds = entry.shops.map(sh => {
      const shopId = uid();
      shops.push({
        id: shopId, stickerId,
        name: sh.name, address: sh.address, prefecture: sh.prefecture,
        lat: sh.lat, lng: sh.lng, mapUrl: sh.mapUrl,
        businessHours: sh.businessHours, closedDays: sh.closedDays,
        wantToVisit: sh.wantToVisit, revisit: sh.revisit,
        stockChecks: sh.stockChecks || [], shopImageUrl: sh.shopImageUrl || '',
      });
      return shopId;
    });
    stickers.push({
      id: stickerId, routeNumber: entry.routeNumber, name: entry.name, region: entry.region,
      releaseDate: entry.releaseDate, imageUrl: entry.imageUrl, notes: entry.notes,
      acquired: entry.acquired, acquiredDate: entry.acquiredDate,
      acquiredShopId: entry.acquired ? shopIds[entry.acquiredShopIndex ?? 0] : '',
      method: entry.method, price: entry.price, rating: entry.rating, favorite: entry.favorite, memo: entry.memo,
      updatedAt: entry.acquiredDate || '2026-01-01',
    });
  });
  return { stickers, shops };
}

function emptySticker() {
  return {
    id: null, routeNumber: '', name: '', region: REGIONS[0], releaseDate: '', imageUrl: '', notes: '',
    acquired: false, acquiredDate: '', acquiredShopId: '', method: '', price: '', memo: '', rating: 0, favorite: false,
  };
}

function emptyShop() {
  return {
    id: null, name: '', address: '', prefecture: '', lat: '', lng: '', mapUrl: '',
    businessHours: '', closedDays: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '',
  };
}

/* ------------------------------------------------------------------ */
/*  ユーティリティ                                                      */
/* ------------------------------------------------------------------ */

async function loadState() {
  try {
    const res = await window.storage.get(STORAGE_KEY, false);
    if (res && res.value) return JSON.parse(res.value);
  } catch (e) { /* キー未存在 */ }
  return null;
}

async function saveState(state) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(state), false); }
  catch (e) { console.error('保存に失敗しました', e); }
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  rows.forEach(r => lines.push(headers.map(h => esc(r[h])).join(',')));
  return lines.join('\n');
}

function toCSVRows(stickers, shops) {
  const rows = [];
  stickers.forEach(s => {
    const related = shops.filter(sh => sh.stickerId === s.id);
    if (related.length === 0) {
      rows.push({ routeNumber: s.routeNumber, name: s.name, region: s.region, acquired: s.acquired, acquiredDate: s.acquiredDate, method: s.method, price: s.price, rating: s.rating, favorite: s.favorite, memo: s.memo, shopName: '', address: '', prefecture: '', lat: '', lng: '', businessHours: '', closedDays: '' });
    } else {
      related.forEach(sh => {
        rows.push({ routeNumber: s.routeNumber, name: s.name, region: s.region, acquired: s.acquired, acquiredDate: s.acquiredDate, method: s.method, price: s.price, rating: s.rating, favorite: s.favorite, memo: s.memo, shopName: sh.name, address: sh.address, prefecture: sh.prefecture, lat: sh.lat, lng: sh.lng, businessHours: sh.businessHours, closedDays: sh.closedDays });
      });
    }
  });
  return rows;
}

/* ------------------------------------------------------------------ */
/*  小コンポーネント                                                    */
/* ------------------------------------------------------------------ */

const ONIGIRI_OUTER_PATH = 'M30,4 L70,4 C85,4 96,15 96,32 C96,52 90,64 78,76 L54,101 C52,104 48,104 46,101 L22,76 C10,64 4,52 4,32 C4,15 15,4 30,4 Z';
const ONIGIRI_INNER_PATH = 'M32,10 L68,10 C80,10 90,19 90,33 C90,50 85,60 75,70 L52,95 C51,97 49,97 48,95 L25,70 C15,60 10,50 10,33 C10,19 20,10 32,10 Z';

function RouteBadge({ number, acquired, size = 44 }) {
  const h = Math.round(size * 1.12);
  const showLabel = size >= 30;
  const fill = acquired ? '#0B4EA2' : '#B9BDC6';
  return (
    <svg
      width={size} height={h} viewBox="0 0 100 110"
      style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
    >
      <path d={ONIGIRI_OUTER_PATH} fill="#fff" />
      <path d={ONIGIRI_INNER_PATH} fill={fill} />
      {showLabel && (
        <>
          <text x="34" y="30" textAnchor="middle" fontFamily="'Noto Sans JP', sans-serif" fontWeight="700" fontSize="13" fill="#fff">国</text>
          <text x="66" y="30" textAnchor="middle" fontFamily="'Noto Sans JP', sans-serif" fontWeight="700" fontSize="13" fill="#fff">道</text>
        </>
      )}
      <text
        x="50" y={showLabel ? 62 : 58} textAnchor="middle"
        fontFamily="'Oswald', sans-serif" fontWeight="700"
        fontSize={showLabel ? 30 : 38} fill="#fff"
      >{number}</text>
      {showLabel && (
        <text x="50" y="80" textAnchor="middle" fontFamily="'Oswald', sans-serif" fontWeight="500" fontSize="11" fill="#fff" letterSpacing="1">ROUTE</text>
      )}
    </svg>
  );
}

function Stars({ value, onChange, size = 16 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? 'var(--warm)' : 'none'}
          color={n <= value ? 'var(--warm)' : 'var(--line)'}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="panel" style={{ padding: '18px 20px', flex: '1 1 160px', minWidth: 150 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 32, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}

function StockCheckAdder({ onAdd }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 140 }} />
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="例: 在庫あり（残り多数）" style={{ flex: 1 }} />
      <button className="btn-secondary" onClick={() => { if (!note.trim()) return; onAdd({ date, note }); setNote(''); }}>追加</button>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(10,14,20,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
};
const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 14 };

/* ------------------------------------------------------------------ */
/*  詳細/編集モーダル（ステッカー＋複数販売店）                            */
/* ------------------------------------------------------------------ */

function DetailModal({ sticker, shopsForSticker, onClose, onSave, onDelete }) {
  const isNew = !sticker.id;
  const [f, setF] = useState({ ...emptySticker(), ...sticker });
  const [shopsList, setShopsList] = useState(
    shopsForSticker && shopsForSticker.length ? shopsForSticker.map(s => ({ ...s })) : [emptyShop()]
  );
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const setShop = (idx, k, v) => setShopsList(prev => prev.map((sh, i) => i === idx ? { ...sh, [k]: v } : sh));
  const addShop = () => setShopsList(prev => [...prev, emptyShop()]);
  const removeShop = (idx) => setShopsList(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    const cleanShops = shopsList.filter(sh => sh.name || sh.address);
    onSave({ sticker: f, shopsList: cleanShops });
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="panel" style={{ width: 'min(640px, 94vw)', maxHeight: '90vh', overflowY: 'auto', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RouteBadge number={f.routeNumber || '?'} acquired={f.acquired} size={36} />
            <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 18 }}>{isNew ? '新規ステッカー登録' : f.name}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>ステッカー情報</div>
          <div style={fieldGrid}>
            <Field label="国道番号"><input type="number" value={f.routeNumber} onChange={e => set('routeNumber', +e.target.value)} /></Field>
            <Field label="ステッカー名"><input value={f.name} onChange={e => set('name', e.target.value)} /></Field>
            <Field label="地域">
              <select value={f.region} onChange={e => set('region', e.target.value)}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="発売日（判明分）"><input type="date" value={f.releaseDate} onChange={e => set('releaseDate', e.target.value)} /></Field>
          </div>
          <Field label="ステッカー画像URL"><input value={f.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="任意" /></Field>

          <div className="hr" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <label className="chk">
              <input type="checkbox" checked={f.acquired} onChange={e => set('acquired', e.target.checked)} /> 取得済み
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.favorite} onChange={e => set('favorite', e.target.checked)} /> お気に入り
            </label>
          </div>

          {f.acquired && (
            <div style={fieldGrid}>
              <Field label="取得日"><input type="date" value={f.acquiredDate} onChange={e => set('acquiredDate', e.target.value)} /></Field>
              <Field label="取得方法">
                <select value={f.method} onChange={e => set('method', e.target.value)}>
                  <option value="">選択してください</option>
                  {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="購入価格（円・任意）"><input type="number" value={f.price} onChange={e => set('price', e.target.value)} /></Field>
              <Field label="評価"><Stars value={f.rating} onChange={v => set('rating', v)} size={20} /></Field>
              <Field label="取得した販売店">
                <select value={f.acquiredShopId} onChange={e => set('acquiredShopId', e.target.value)}>
                  <option value="">未指定</option>
                  {shopsList.map((sh, i) => <option key={sh.id || i} value={sh.id || `__new${i}`}>{sh.name || `店舗${i + 1}`}</option>)}
                </select>
              </Field>
            </div>
          )}

          <Field label="メモ / 備考"><textarea rows={3} value={f.memo} onChange={e => set('memo', e.target.value)} /></Field>

          <div className="hr" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>販売店一覧（{shopsList.length}件）</div>
            <button className="btn-secondary" onClick={addShop}><Plus size={14} /> 販売店を追加</button>
          </div>

          {shopsList.map((sh, idx) => (
            <div key={idx} className="shop-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>店舗 {idx + 1}</div>
                <button className="icon-btn" onClick={() => removeShop(idx)}><Trash2 size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="販売店名"><input value={sh.name} onChange={e => setShop(idx, 'name', e.target.value)} /></Field>
                <Field label="販売店住所"><input value={sh.address} onChange={e => setShop(idx, 'address', e.target.value)} /></Field>
                <div style={fieldGrid}>
                  <Field label="都道府県"><input value={sh.prefecture} onChange={e => setShop(idx, 'prefecture', e.target.value)} /></Field>
                  <Field label="緯度（地図表示用）"><input type="number" step="0.0001" value={sh.lat} onChange={e => setShop(idx, 'lat', e.target.value === '' ? '' : +e.target.value)} /></Field>
                  <Field label="経度（地図表示用）"><input type="number" step="0.0001" value={sh.lng} onChange={e => setShop(idx, 'lng', e.target.value === '' ? '' : +e.target.value)} /></Field>
                </div>
                <Field label="Googleマップリンク"><input value={sh.mapUrl} onChange={e => setShop(idx, 'mapUrl', e.target.value)} placeholder="https://maps.google.com/..." /></Field>
                <div style={fieldGrid}>
                  <Field label="営業時間"><input value={sh.businessHours} onChange={e => setShop(idx, 'businessHours', e.target.value)} placeholder="例: 9:00-17:00" /></Field>
                  <Field label="定休日"><input value={sh.closedDays} onChange={e => setShop(idx, 'closedDays', e.target.value)} placeholder="例: 水曜定休" /></Field>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <label className="chk"><input type="checkbox" checked={sh.wantToVisit} onChange={e => setShop(idx, 'wantToVisit', e.target.checked)} /> 訪問予定（未訪問）</label>
                  <label className="chk"><input type="checkbox" checked={sh.revisit} onChange={e => setShop(idx, 'revisit', e.target.checked)} /> 再訪問予定</label>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 6 }}>在庫確認メモ</div>
                  {(sh.stockChecks || []).map((sc, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 90 }}>{sc.date}</span>
                      <span style={{ fontSize: 13, flex: 1 }}>{sc.note}</span>
                      <button className="icon-btn" onClick={() => setShop(idx, 'stockChecks', sh.stockChecks.filter((_, j) => j !== i))}><X size={14} /></button>
                    </div>
                  ))}
                  <StockCheckAdder onAdd={(entry) => setShop(idx, 'stockChecks', [...(sh.stockChecks || []), entry])} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 22px', borderTop: '1px solid var(--line)', position: 'sticky', bottom: 0, background: 'var(--panel)' }}>
          {!isNew ? (
            <button className="btn-danger" onClick={() => onDelete(f.id)}><Trash2 size={15} /> ステッカーを削除</button>
          ) : <span />}
          <button className="btn-primary" onClick={handleSave}><Check size={15} /> 保存</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  メインアプリ                                                        */
/* ------------------------------------------------------------------ */

export default function App() {
  const [stickers, setStickers] = useState([]);
  const [shops, setShops] = useState([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState('home');
  const [layout, setLayout] = useState('grid');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('route-asc');
  const [editing, setEditing] = useState(null); // { sticker, shops } | null
  const [toast, setToast] = useState('');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await loadState();
      if (saved && saved.stickers && saved.stickers.length) {
        setStickers(saved.stickers);
        setShops(saved.shops || []);
      } else {
        const seed = buildSeed();
        setStickers(seed.stickers);
        setShops(seed.shops);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) saveState({ stickers, shops }); }, [stickers, shops, ready]);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    const captureInstall = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('beforeinstallprompt', captureInstall);
    };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const requestInstall = async () => {
    if (!installPrompt) { showToast('この環境ではインストールできません（デプロイ後に利用可能）'); return; }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const openEditor = (sticker) => {
    const relatedShops = shops.filter(sh => sh.stickerId === sticker.id);
    setEditing({ sticker, shops: relatedShops });
  };
  const openNew = () => setEditing({ sticker: emptySticker(), shops: [] });

  const filtered = useMemo(() => {
    let list = stickers.map(s => ({ ...s, shopsList: shops.filter(sh => sh.stickerId === s.id) }));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s =>
        String(s.routeNumber).includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q) ||
        s.memo?.toLowerCase().includes(q) ||
        s.shopsList.some(sh => sh.name?.toLowerCase().includes(q) || sh.prefecture?.toLowerCase().includes(q) || sh.address?.toLowerCase().includes(q))
      );
    }
    if (filter === 'acquired') list = list.filter(s => s.acquired);
    if (filter === 'pending') list = list.filter(s => !s.acquired);
    if (filter === 'favorite') list = list.filter(s => s.favorite);

    const cmp = {
      'route-asc': (a, b) => a.routeNumber - b.routeNumber,
      'route-desc': (a, b) => b.routeNumber - a.routeNumber,
      'prefecture': (a, b) => (a.shopsList[0]?.prefecture || '').localeCompare(b.shopsList[0]?.prefecture || '', 'ja'),
      'region': (a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region),
      'acquired-date': (a, b) => (b.acquiredDate || '').localeCompare(a.acquiredDate || ''),
      'updated': (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
      'shop': (a, b) => (a.shopsList[0]?.name || '').localeCompare(b.shopsList[0]?.name || '', 'ja'),
      'favorite': (a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0),
    }[sort];
    list.sort(cmp);
    return list;
  }, [stickers, shops, query, filter, sort]);

  const stats = useMemo(() => {
    const total = stickers.length;
    const acquired = stickers.filter(s => s.acquired).length;
    const rate = total ? Math.round((acquired / total) * 1000) / 10 : 0;

    const byPref = {};
    stickers.forEach(s => {
      if (s.acquired && s.acquiredShopId) {
        const sh = shops.find(x => x.id === s.acquiredShopId);
        if (sh?.prefecture) byPref[sh.prefecture] = (byPref[sh.prefecture] || 0) + 1;
      }
    });
    const prefRanking = Object.entries(byPref).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

    const byRegion = REGIONS.map(r => ({
      name: r,
      total: stickers.filter(s => s.region === r).length,
      acquired: stickers.filter(s => s.region === r && s.acquired).length,
    }));

    const byMonth = {};
    stickers.forEach(s => {
      if (s.acquired && s.acquiredDate) {
        const m = s.acquiredDate.slice(0, 7);
        byMonth[m] = (byMonth[m] || 0) + 1;
      }
    });
    const monthly = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([m, c]) => ({ month: m.slice(5), count: c }));

    const recent = [...stickers].filter(s => s.acquired).sort((a, b) => (b.acquiredDate || '').localeCompare(a.acquiredDate || '')).slice(0, 5)
      .map(s => ({ ...s, shopName: shops.find(sh => sh.id === s.acquiredShopId)?.name || '' }));

    return { total, acquired, pending: total - acquired, rate, prefRanking, byRegion, monthly, recent };
  }, [stickers, shops]);

  const upsertSticker = ({ sticker, shopsList }) => {
    const now = new Date().toISOString().slice(0, 10);
    const stickerId = sticker.id || uid();
    setStickers(prev => sticker.id
      ? prev.map(s => s.id === stickerId ? { ...sticker, id: stickerId, updatedAt: now } : s)
      : [...prev, { ...sticker, id: stickerId, updatedAt: now }]);
    setShops(prev => {
      const others = prev.filter(sh => sh.stickerId !== stickerId);
      const finalized = shopsList.map(sh => ({ ...sh, id: sh.id || uid(), stickerId }));
      return [...others, ...finalized];
    });
    setEditing(null);
    showToast(sticker.id ? '保存しました' : '登録しました');
  };

  const removeSticker = (id) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setShops(prev => prev.filter(sh => sh.stickerId !== id));
    setEditing(null);
    showToast('削除しました');
  };

  const toggleFavorite = (id) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s));
  };

  const toggleAcquired = (id) => {
    const today = new Date().toISOString().slice(0, 10);
    setStickers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextAcquired = !s.acquired;
      return {
        ...s,
        acquired: nextAcquired,
        acquiredDate: nextAcquired ? (s.acquiredDate || today) : '',
      };
    }));
  };

  const exportJSON = () => { download('kokudo-stickers.json', JSON.stringify({ stickers, shops }, null, 2)); showToast('JSONを書き出しました'); };
  const exportCSV = () => { download('kokudo-stickers.csv', toCSV(toCSVRows(stickers, shops))); showToast('CSVを書き出しました'); };

  const importCSVText = (text) => {
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').replace(/^"|"$/g, ''); });
      return obj;
    });
    const stickerMap = new Map();
    const newShops = [];
    rows.forEach(r => {
      const key = `${r.routeNumber}__${r.name}`;
      if (!stickerMap.has(key)) {
        stickerMap.set(key, {
          id: uid(), routeNumber: +r.routeNumber || 0, name: r.name, region: r.region || REGIONS[0],
          releaseDate: '', imageUrl: '', notes: '',
          acquired: r.acquired === 'true', acquiredDate: r.acquiredDate || '', acquiredShopId: '',
          method: r.method || '', price: +r.price || '', rating: +r.rating || 0, favorite: r.favorite === 'true', memo: r.memo || '',
          updatedAt: r.acquiredDate || '2026-01-01',
        });
      }
      const sticker = stickerMap.get(key);
      if (r.shopName) {
        const shopId = uid();
        newShops.push({
          id: shopId, stickerId: sticker.id, name: r.shopName, address: r.address || '', prefecture: r.prefecture || '',
          lat: +r.lat || '', lng: +r.lng || '', mapUrl: '', businessHours: r.businessHours || '', closedDays: r.closedDays || '',
          wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '',
        });
        if (sticker.acquired && !sticker.acquiredShopId) sticker.acquiredShopId = shopId;
      }
    });
    setStickers(Array.from(stickerMap.values()));
    setShops(newShops);
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(reader.result);
          setStickers((data.stickers || []).map(s => ({ ...s, id: s.id || uid() })));
          setShops((data.shops || []).map(sh => ({ ...sh, id: sh.id || uid() })));
          showToast('JSONを読み込みました');
        } else {
          importCSVText(reader.result);
          showToast('CSVを読み込みました');
        }
      } catch (err) { showToast('読み込みに失敗しました'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const mergeMasterData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        const incStickers = incoming.stickers || [];
        const incShops = incoming.shops || [];
        const nextStickers = [...stickers];
        const idMap = {};
        let addedStickers = 0, updatedStickers = 0;
        incStickers.forEach((inc, i) => {
          const idx = nextStickers.findIndex(s => s.routeNumber === inc.routeNumber && s.name === inc.name);
          if (idx >= 0) {
            updatedStickers++;
            idMap[inc.id ?? i] = nextStickers[idx].id;
            nextStickers[idx] = { ...nextStickers[idx], region: inc.region ?? nextStickers[idx].region, releaseDate: inc.releaseDate ?? nextStickers[idx].releaseDate, imageUrl: inc.imageUrl ?? nextStickers[idx].imageUrl, notes: inc.notes ?? nextStickers[idx].notes };
          } else {
            const newId = uid();
            idMap[inc.id ?? i] = newId;
            addedStickers++;
            nextStickers.push({ ...emptySticker(), ...inc, id: newId, updatedAt: new Date().toISOString().slice(0, 10) });
          }
        });
        const nextShops = [...shops];
        let addedShops = 0, updatedShops = 0;
        incShops.forEach(inc => {
          const stickerId = idMap[inc.stickerId] ?? inc.stickerId;
          const idx = nextShops.findIndex(sh => sh.stickerId === stickerId && sh.name === inc.name);
          if (idx >= 0) {
            updatedShops++;
            nextShops[idx] = { ...nextShops[idx], address: inc.address ?? nextShops[idx].address, prefecture: inc.prefecture ?? nextShops[idx].prefecture, lat: inc.lat ?? nextShops[idx].lat, lng: inc.lng ?? nextShops[idx].lng, mapUrl: inc.mapUrl ?? nextShops[idx].mapUrl, businessHours: inc.businessHours ?? nextShops[idx].businessHours, closedDays: inc.closedDays ?? nextShops[idx].closedDays };
          } else {
            addedShops++;
            nextShops.push({ ...emptyShop(), ...inc, id: uid(), stickerId });
          }
        });
        setStickers(nextStickers);
        setShops(nextShops);
        showToast(`マスター更新: ステッカー新規${addedStickers}/更新${updatedStickers}、販売店新規${addedShops}/更新${updatedShops}`);
      } catch (err) { showToast('更新に失敗しました'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetData = () => {
    if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      setStickers([]);
      setShops([]);
      showToast('データを初期化しました');
    }
  };

  const resetAcquisitions = () => {
    if (confirm('登録されている全ステッカーの「取得状況」をリセットして、すべて未取得に戻しますか？ステッカー自体や販売店情報は消えません。')) {
      setStickers(prev => prev.map(s => ({
        ...s,
        acquired: false, acquiredDate: '', acquiredShopId: '',
        method: '', price: '', rating: 0, memo: s.memo,
      })));
      showToast('取得状況をすべてリセットしました');
    }
  };

  if (!ready) return <div style={{ padding: 40, color: 'var(--muted)' }}>読み込み中…</div>;

  return (
    <div className="app-root">
      <style>{CSS}</style>

      <nav className="sidenav">
        <div className="brand">
          <RouteBadge number="R" acquired size={40} />
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 15 }}>国道ステッカー</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>コレクション帳</div>
          </div>
        </div>
        <NavBtn icon={<Home size={18} />} label="ホーム" active={view === 'home'} onClick={() => setView('home')} />
        <NavBtn icon={<LayoutGrid size={18} />} label="ステッカー一覧" active={view === 'list'} onClick={() => setView('list')} />
        <NavBtn icon={<MapPin size={18} />} label="販売店マップ" active={view === 'map'} onClick={() => setView('map')} />
        <NavBtn icon={<Navigation size={18} />} label="全国国道マップ" active={view === 'nationalmap'} onClick={() => setView('nationalmap')} />
        <NavBtn icon={<CalendarDays size={18} />} label="訪問予定リスト" active={view === 'visitplan'} onClick={() => setView('visitplan')} />
        <NavBtn icon={<Images size={18} />} label="アルバム" active={view === 'album'} onClick={() => setView('album')} />
        <NavBtn icon={<BarChart3 size={18} />} label="統計" active={view === 'stats'} onClick={() => setView('stats')} />
        <NavBtn icon={<Settings size={18} />} label="設定・バックアップ" active={view === 'settings'} onClick={() => setView('settings')} />
      </nav>

      <main className="content">
        {isOffline && <div className="offline-banner">オフラインです。一部の機能が制限される場合があります。</div>}

        {view === 'home' && (
          <HomeView stats={stats} onGoList={() => setView('list')} onAdd={openNew} />
        )}
        {view === 'list' && (
          <ListView
            filtered={filtered} layout={layout} setLayout={setLayout}
            query={query} setQuery={setQuery} filter={filter} setFilter={setFilter}
            sort={sort} setSort={setSort}
            onOpen={openEditor} onAdd={openNew} onToggleFav={toggleFavorite} onToggleAcquired={toggleAcquired}
          />
        )}
        {view === 'map' && <MapView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'nationalmap' && <NationalMapView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'visitplan' && <VisitPlanView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'album' && <AlbumView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'stats' && <StatsView stats={stats} stickers={stickers} shops={shops} />}
        {view === 'settings' && (
          <SettingsView
            onExportJSON={exportJSON} onExportCSV={exportCSV} onImport={importFile}
            onMergeMaster={mergeMasterData} onReset={resetData} onResetAcquisitions={resetAcquisitions}
            count={stickers.length} onInstall={requestInstall} canInstall={!!installPrompt}
          />
        )}
      </main>

      {editing && (
        <DetailModal
          sticker={editing.sticker} shopsForSticker={editing.shops}
          onClose={() => setEditing(null)} onSave={upsertSticker} onDelete={removeSticker}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button className={`navbtn ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  ホーム / ダッシュボード                                              */
/* ------------------------------------------------------------------ */

function HomeView({ stats, onGoList, onAdd }) {
  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">DASHBOARD</div>
          <h1>収集の進み具合</h1>
        </div>
        <button className="btn-primary" onClick={onAdd}><Plus size={16} /> ステッカーを登録</button>
      </header>

      <div className="hero panel">
        <div className="hero-ring">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="12"
              strokeDasharray={`${(stats.rate / 100) * 326.7} 326.7`}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="hero-ring-label">
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 700 }}>{stats.rate}%</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>達成率</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>全国国道ステッカー コンプリートまで</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600 }}>
            {stats.acquired} / {stats.total} 枚 取得済み（残り {stats.pending} 枚）
          </div>
          <button className="link-btn" onClick={onGoList}>一覧を見る →</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
        <StatCard label="総取得枚数" value={stats.acquired} />
        <StatCard label="未取得枚数" value={stats.pending} />
        <StatCard label="最終取得日" value={stats.recent[0]?.acquiredDate || '—'} />
        <StatCard label="平均評価" value={
          stats.recent.length ? (stats.recent.reduce((a, s) => a + (s.rating || 0), 0) / stats.recent.length).toFixed(1) : '—'
        } />
      </div>

      <div className="panel" style={{ marginTop: 18, padding: 20 }}>
        <div className="panel-title">最近取得したステッカー</div>
        {stats.recent.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>まだ取得記録がありません。</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {stats.recent.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RouteBadge number={s.routeNumber} acquired size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.shopName || '販売店未指定'} ・ {s.acquiredDate}</div>
              </div>
              <Stars value={s.rating} size={13} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  一覧                                                                */
/* ------------------------------------------------------------------ */

function ListView({ filtered, layout, setLayout, query, setQuery, filter, setFilter, sort, setSort, onOpen, onAdd, onToggleFav, onToggleAcquired }) {
  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">COLLECTION</div>
          <h1>ステッカー一覧</h1>
        </div>
        <button className="btn-primary" onClick={onAdd}><Plus size={16} /> 新規登録</button>
      </header>

      <div className="toolbar panel">
        <div className="search-box">
          <Search size={16} color="var(--muted)" />
          <input placeholder="国道番号・名前・地域・販売店で検索" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">すべて</option>
          <option value="acquired">取得済みのみ</option>
          <option value="pending">未取得のみ</option>
          <option value="favorite">お気に入りのみ</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="route-asc">国道番号順</option>
          <option value="route-desc">国道番号（降順）</option>
          <option value="prefecture">都道府県順（代表店舗）</option>
          <option value="region">地域順</option>
          <option value="acquired-date">取得日順</option>
          <option value="updated">更新日順</option>
          <option value="shop">販売店順（代表店舗）</option>
          <option value="favorite">お気に入り順</option>
        </select>
        <div className="seg">
          <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')}><LayoutGrid size={15} /></button>
          <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')}><ListIcon size={15} /></button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 2px' }}>{filtered.length} 件表示中</div>

      {layout === 'grid' ? (
        <div className="grid">
          {filtered.map(s => {
            const primaryShop = s.acquired ? (s.shopsList.find(sh => sh.id === s.acquiredShopId) || s.shopsList[0]) : s.shopsList[0];
            const extraCount = s.shopsList.length - 1;
            return (
              <div key={s.id} className="card" onClick={() => onOpen(s)}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <RouteBadge number={s.routeNumber} acquired={s.acquired} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.region}</div>
                  </div>
                  <button className="icon-btn" onClick={e => { e.stopPropagation(); onToggleFav(s.id); }}>
                    <Star size={16} fill={s.favorite ? 'var(--warm)' : 'none'} color={s.favorite ? 'var(--warm)' : 'var(--muted)'} />
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Store size={12} /> {primaryShop?.name || '販売店未登録'}{extraCount > 0 && <span className="shop-count-badge">他{extraCount}店舗</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span
                    className={`badge badge-tap ${s.acquired ? 'badge-ok' : 'badge-pending'}`}
                    onClick={e => { e.stopPropagation(); onToggleAcquired(s.id); }}
                  >{s.acquired ? '✓ 取得済み' : '未取得（タップで取得）'}</span>
                  <Stars value={s.rating} size={13} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((s, i) => {
            const primaryShop = s.acquired ? (s.shopsList.find(sh => sh.id === s.acquiredShopId) || s.shopsList[0]) : s.shopsList[0];
            const extraCount = s.shopsList.length - 1;
            return (
              <div key={s.id} className="row" style={{ borderTop: i ? '1px solid var(--line)' : 'none' }} onClick={() => onOpen(s)}>
                <RouteBadge number={s.routeNumber} acquired={s.acquired} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {primaryShop?.name || '販売店未登録'}{extraCount > 0 && <span className="shop-count-badge">他{extraCount}店舗</span>}
                  </div>
                </div>
                <span
                  className={`badge badge-tap ${s.acquired ? 'badge-ok' : 'badge-pending'}`}
                  onClick={e => { e.stopPropagation(); onToggleAcquired(s.id); }}
                >{s.acquired ? '✓ 取得済み' : '未取得'}</span>
                <Stars value={s.rating} size={13} />
                <button className="icon-btn" onClick={e => { e.stopPropagation(); onToggleFav(s.id); }}>
                  <Star size={16} fill={s.favorite ? 'var(--warm)' : 'none'} color={s.favorite ? 'var(--warm)' : 'var(--muted)'} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  販売店マップ                                                        */
/* ------------------------------------------------------------------ */

function useLeaflet() {
  const [ready, setReady] = useState(!!(typeof window !== 'undefined' && window.L));
  useEffect(() => {
    if (ready) return;
    if (window.L) { setReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, [ready]);
  return ready;
}

function MapView({ stickers, shops, onOpen }) {
  const leafletReady = useLeaflet();
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const layerRef = useRef(null);
  const myMarkerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [embedMode, setEmbedMode] = useState('google');
  const [sortMode, setSortMode] = useState('default');
  const [radius, setRadius] = useState('all');
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const { pos: myPos, error: locError, loading: locLoading, locate } = useMyLocation();

  const joined = useMemo(() =>
    shops.filter(sh => sh.lat && sh.lng).map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) })).filter(sh => sh.sticker),
  [shops, stickers]);

  const filtered = useMemo(() => {
    let list = [...joined];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(sh =>
        sh.sticker.name?.toLowerCase().includes(q) || sh.name?.toLowerCase().includes(q) ||
        sh.prefecture?.toLowerCase().includes(q) || String(sh.sticker.routeNumber).includes(q)
      );
    }
    if (filter === 'acquired') list = list.filter(sh => sh.sticker.acquired);
    if (filter === 'pending') list = list.filter(sh => !sh.sticker.acquired);
    if (filter === 'favorite') list = list.filter(sh => sh.sticker.favorite);
    if (myPos) {
      list = list.map(sh => ({ ...sh, _dist: distanceKm(myPos.lat, myPos.lng, sh.lat, sh.lng) }));
      if (radius !== 'all') list = list.filter(sh => sh._dist <= Number(radius));
      if (sortMode === 'distance') list.sort((a, b) => a._dist - b._dist);
    }
    return list;
  }, [joined, query, filter, myPos, sortMode, radius]);

  const selected = shops.find(sh => sh.id === selectedId);
  const selectedSticker = selected ? stickers.find(s => s.id === selected.stickerId) : null;

  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapObjRef.current) return;
    const L = window.L;
    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([36.5, 137.5], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapObjRef.current = map;
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapObjRef.current || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();
    filtered.forEach(sh => {
      const color = sh.sticker.acquired ? '#0B4EA2' : '#B9BDC6';
      const ring = sh.sticker.favorite ? '3px solid #E7A400' : '2px solid #fff';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:${ring};box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const marker = L.marker([sh.lat, sh.lng], { icon }).addTo(layerRef.current);
      const content = document.createElement('div');
      content.style.fontFamily = "'Noto Sans JP', sans-serif";
      content.style.fontSize = '13px';
      content.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;">国道${sh.sticker.routeNumber}号 ${sh.sticker.name || ''}</div>
        <div style="color:#767b85;margin-bottom:6px;">${sh.name || '販売店未登録'}</div>
        <div style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:${sh.sticker.acquired ? '#E4F0FF' : '#F0F0EE'};color:${sh.sticker.acquired ? '#0B4EA2' : '#767b85'};">${sh.sticker.acquired ? '取得済み' : '未取得'}</div>
      `;
      const btn = document.createElement('button');
      btn.textContent = '詳細を開く';
      btn.style.cssText = 'margin-top:8px;display:block;width:100%;padding:6px 10px;border:none;border-radius:6px;background:#0B4EA2;color:#fff;font-size:12px;font-weight:600;cursor:pointer;';
      btn.onclick = () => onOpenRef.current(sh.sticker);
      content.appendChild(btn);
      marker.bindPopup(content);
      marker.on('click', () => setSelectedId(sh.id));
    });
  }, [filtered, leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapObjRef.current || !myPos) return;
    const L = window.L;
    if (myMarkerRef.current) { myMarkerRef.current.remove(); }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#2E7D32;border:3px solid #fff;box-shadow:0 0 0 4px rgba(46,125,50,0.25);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    myMarkerRef.current = L.marker([myPos.lat, myPos.lng], { icon, zIndexOffset: 1000 }).addTo(mapObjRef.current);
    myMarkerRef.current.bindPopup('現在地');
    mapObjRef.current.setView([myPos.lat, myPos.lng], 11, { animate: true });
  }, [myPos, leafletReady]);

  const flyTo = (sh) => {
    setSelectedId(sh.id);
    if (mapObjRef.current) mapObjRef.current.setView([sh.lat, sh.lng], 10, { animate: true });
  };

  return (
    <div className="view" style={{ maxWidth: 1200 }}>
      <header className="view-header">
        <div>
          <div className="eyebrow">SHOP MAP</div>
          <h1>販売店マップ</h1>
        </div>
        <button className="btn-secondary" onClick={locate} disabled={locLoading}>
          <Locate size={15} /> {locLoading ? '取得中…' : '現在地を表示'}
        </button>
      </header>
      {locError && <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 10 }}>{locError}</div>}

      <div className="map-layout">
        <div className="map-sidebar panel">
          <div style={{ padding: 12, borderBottom: '1px solid var(--line)' }}>
            <div className="search-box" style={{ marginBottom: 8 }}>
              <Search size={15} color="var(--muted)" />
              <input placeholder="販売店・国道番号で検索" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
              <option value="all">すべて表示</option>
              <option value="acquired">取得済みのみ</option>
              <option value="pending">未取得のみ</option>
              <option value="favorite">お気に入りのみ</option>
            </select>
            {myPos && (
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={sortMode} onChange={e => setSortMode(e.target.value)} style={{ flex: 1 }}>
                  <option value="default">並び順：通常</option>
                  <option value="distance">並び順：現在地から近い順</option>
                </select>
                <select value={radius} onChange={e => setRadius(e.target.value)} style={{ flex: 1 }}>
                  <option value="all">距離：すべて</option>
                  <option value="10">10km以内</option>
                  <option value="30">30km以内</option>
                  <option value="50">50km以内</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
              <span><i className="dot" style={{ background: '#0B4EA2' }} /> 取得済み</span>
              <span><i className="dot" style={{ background: '#B9BDC6' }} /> 未取得</span>
              {myPos && <span><i className="dot" style={{ background: '#2E7D32' }} /> 現在地</span>}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>座標(緯度・経度)が登録された販売店がありません。詳細編集画面から登録してください。</div>}
            {filtered.map(sh => (
              <div key={sh.id} className={`map-list-item ${sh.id === selectedId ? 'active' : ''}`} onClick={() => flyTo(sh)}>
                <span className="dot" style={{ background: sh.sticker.acquired ? '#0B4EA2' : '#B9BDC6' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>国道{sh.sticker.routeNumber}号 ・ {sh.name || '販売店未登録'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sh.prefecture}{typeof sh._dist === 'number' ? ` ・ 約${sh._dist.toFixed(1)}km` : ''}</div>
                </div>
                {sh.sticker.favorite && <Star size={13} fill="var(--warm)" color="var(--warm)" />}
              </div>
            ))}
          </div>
        </div>

        <div className="map-main">
          <div ref={mapDivRef} className="leaflet-holder">
            {!leafletReady && <div style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>地図を読み込み中…</div>}
          </div>

          {selected && selectedSticker && (
            <div className="panel map-detail">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>国道{selectedSticker.routeNumber}号 {selectedSticker.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{selected.name} ・ {selected.address}</div>
                </div>
                <button className="icon-btn" onClick={() => setSelectedId(null)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => onOpen(selectedSticker)}>詳細を編集</button>
                <a className="btn-secondary" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.address || selected.name)}`} target="_blank" rel="noreferrer">
                  <Navigation size={14} /> Googleナビ起動
                </a>
                <div className="seg">
                  <button className={embedMode === 'google' ? 'active' : ''} onClick={() => setEmbedMode('google')}>GoogleMap</button>
                  <button className={embedMode === 'osm' ? 'active' : ''} onClick={() => setEmbedMode('osm')}>OpenStreetMap</button>
                </div>
              </div>
              <div className="map-embed">
                {embedMode === 'google' ? (
                  <iframe title="google-map" src={`https://maps.google.com/maps?q=${encodeURIComponent(selected.address || selected.name)}&output=embed`} loading="lazy" />
                ) : (
                  <iframe title="osm-map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.lng - 0.01}%2C${selected.lat - 0.008}%2C${selected.lng + 0.01}%2C${selected.lat + 0.008}&marker=${selected.lat}%2C${selected.lng}`} loading="lazy" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  全国国道マップ                                                      */
/* ------------------------------------------------------------------ */

function NationalMapView({ stickers, shops, onOpen }) {
  const leafletReady = useLeaflet();
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const layerRef = useRef(null);
  const myMarkerRef = useRef(null);
  const [region, setRegion] = useState('all');
  const [prefecture, setPrefecture] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const { pos: myPos, error: locError, loading: locLoading, locate } = useMyLocation();

  useEffect(() => {
    if (!leafletReady || !mapObjRef.current || !myPos) return;
    const L = window.L;
    if (myMarkerRef.current) { myMarkerRef.current.remove(); }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#2E7D32;border:3px solid #fff;box-shadow:0 0 0 4px rgba(46,125,50,0.25);"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8],
    });
    myMarkerRef.current = L.marker([myPos.lat, myPos.lng], { icon, zIndexOffset: 1000 }).addTo(mapObjRef.current);
    myMarkerRef.current.bindPopup('現在地');
    mapObjRef.current.setView([myPos.lat, myPos.lng], 9, { animate: true });
  }, [myPos, leafletReady]);

  const prefectures = useMemo(() => Array.from(new Set(shops.map(sh => sh.prefecture).filter(Boolean))).sort(), [shops]);

  const joined = useMemo(() =>
    shops.filter(sh => sh.lat && sh.lng).map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) })).filter(sh => sh.sticker),
  [shops, stickers]);

  const filtered = useMemo(() => {
    let list = [...joined];
    if (region !== 'all') list = list.filter(sh => sh.sticker.region === region);
    if (prefecture !== 'all') list = list.filter(sh => sh.prefecture === prefecture);
    if (statusFilter === 'acquired') list = list.filter(sh => sh.sticker.acquired);
    if (statusFilter === 'pending') list = list.filter(sh => !sh.sticker.acquired);
    return list;
  }, [joined, region, prefecture, statusFilter]);

  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapObjRef.current) return;
    const L = window.L;
    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([37.2, 138.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapObjRef.current = map;
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapObjRef.current || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();
    filtered.forEach(sh => {
      const isSelected = sh.sticker.id === selectedId;
      const fill = isSelected ? '#C0392B' : (sh.sticker.acquired ? '#0B4EA2' : '#B9BDC6');
      const size = isSelected ? 36 : 30;
      const h = Math.round(size * 1.12);
      const outerPath = 'M30,4 L70,4 C85,4 96,15 96,32 C96,52 90,64 78,76 L54,101 C52,104 48,104 46,101 L22,76 C10,64 4,52 4,32 C4,15 15,4 30,4 Z';
      const innerPath = 'M32,10 L68,10 C80,10 90,19 90,33 C90,50 85,60 75,70 L52,95 C51,97 49,97 48,95 L25,70 C15,60 10,50 10,33 C10,19 20,10 32,10 Z';
      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size}" height="${h}" viewBox="0 0 100 110" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));">
                 <path d="${outerPath}" fill="#fff" />
                 <path d="${innerPath}" fill="${fill}" />
                 <text x="34" y="30" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-weight="700" font-size="13" fill="#fff">国</text>
                 <text x="66" y="30" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-weight="700" font-size="13" fill="#fff">道</text>
                 <text x="50" y="62" text-anchor="middle" font-family="'Oswald',sans-serif" font-weight="700" font-size="30" fill="#fff">${sh.sticker.routeNumber}</text>
                 <text x="50" y="80" text-anchor="middle" font-family="'Oswald',sans-serif" font-weight="500" font-size="11" fill="#fff" letter-spacing="1">ROUTE</text>
               </svg>`,
        iconSize: [size, h], iconAnchor: [size / 2, h * 0.5],
      });
      const marker = L.marker([sh.lat, sh.lng], { icon }).addTo(layerRef.current);
      marker.on('click', () => setSelectedId(sh.sticker.id));
      const content = document.createElement('div');
      content.style.fontFamily = "'Noto Sans JP', sans-serif";
      content.style.fontSize = '13px';
      content.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;">国道${sh.sticker.routeNumber}号 ${sh.sticker.name || ''}</div>
        <div style="color:#767b85;margin-bottom:6px;">${sh.prefecture} ・ ${sh.sticker.region}</div>
        <div style="display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:${sh.sticker.acquired ? '#E4F0FF' : '#F0F0EE'};color:${sh.sticker.acquired ? '#0B4EA2' : '#767b85'};">${sh.sticker.acquired ? '取得済み' : '未取得'}</div>
      `;
      const btn = document.createElement('button');
      btn.textContent = '詳細を開く';
      btn.style.cssText = 'margin-top:8px;display:block;width:100%;padding:6px 10px;border:none;border-radius:6px;background:#0B4EA2;color:#fff;font-size:12px;font-weight:600;cursor:pointer;';
      btn.onclick = () => onOpenRef.current(sh.sticker);
      content.appendChild(btn);
      marker.bindPopup(content);
    });
  }, [filtered, leafletReady, selectedId]);

  const acquiredCount = new Set(filtered.filter(sh => sh.sticker.acquired).map(sh => sh.sticker.id)).size;

  return (
    <div className="view" style={{ maxWidth: 1200 }}>
      <header className="view-header">
        <div>
          <div className="eyebrow">NATIONAL MAP</div>
          <h1>全国国道マップ</h1>
        </div>
        <button className="btn-secondary" onClick={locate} disabled={locLoading}>
          <Locate size={15} /> {locLoading ? '取得中…' : '現在地を表示'}
        </button>
      </header>
      {locError && <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 10 }}>{locError}</div>}

      <div className="toolbar panel" style={{ marginBottom: 14 }}>
        <select value={region} onChange={e => { setRegion(e.target.value); setPrefecture('all'); }}>
          <option value="all">地域：すべて</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={prefecture} onChange={e => setPrefecture(e.target.value)}>
          <option value="all">都道府県：すべて</option>
          {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">すべて表示</option>
          <option value="acquired">取得済みのみ</option>
          <option value="pending">未取得のみ</option>
        </select>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>
          <span><i className="dot" style={{ background: '#0B4EA2' }} /> 取得済み</span>
          <span><i className="dot" style={{ background: '#B9BDC6' }} /> 未取得</span>
          <span><i className="dot" style={{ background: '#C0392B' }} /> 選択中</span>
          {myPos && <span><i className="dot" style={{ background: '#2E7D32' }} /> 現在地</span>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '0 2px 10px' }}>
        表示中 {filtered.length} 件（うち取得済みステッカー {acquiredCount} 件）
      </div>

      <div ref={mapDivRef} className="leaflet-holder" style={{ height: 560 }}>
        {!leafletReady && <div style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>地図を読み込み中…</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  アルバム                                                            */
/* ------------------------------------------------------------------ */

function AlbumView({ stickers, shops, onOpen }) {
  const [tab, setTab] = useState('sticker');
  const [lightbox, setLightbox] = useState(null);

  const stickerPhotos = useMemo(() =>
    stickers.filter(s => s.imageUrl).sort((a, b) => (b.acquiredDate || '').localeCompare(a.acquiredDate || '')),
  [stickers]);

  const shopPhotos = useMemo(() =>
    shops.filter(sh => sh.shopImageUrl).map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) })).filter(sh => sh.sticker),
  [shops, stickers]);

  const list = tab === 'sticker' ? stickerPhotos : shopPhotos;

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">ALBUM</div>
          <h1>アルバム</h1>
        </div>
      </header>

      <div className="seg" style={{ marginBottom: 16, display: 'inline-flex' }}>
        <button className={tab === 'sticker' ? 'active' : ''} onClick={() => setTab('sticker')}>ステッカー画像（{stickerPhotos.length}）</button>
        <button className={tab === 'shop' ? 'active' : ''} onClick={() => setTab('shop')}>販売店写真（{shopPhotos.length}）</button>
      </div>

      {list.length === 0 && (
        <div className="panel" style={{ padding: 24, fontSize: 13, color: 'var(--muted)' }}>
          {tab === 'sticker' ? 'ステッカー画像URLが登録されたステッカーはまだありません。詳細編集画面の「ステッカー画像URL」から登録できます。' : '写真URLが登録された販売店はまだありません。詳細編集画面の販売店ごとに登録できます。'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {tab === 'sticker' && stickerPhotos.map(s => (
          <div key={s.id} className="panel" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(s.imageUrl)}>
            <div style={{ aspectRatio: '1', background: `url(${s.imageUrl}) center/cover no-repeat, var(--panel-2)` }} />
            <div style={{ padding: '8px 10px' }} onClick={(e) => { e.stopPropagation(); onOpen(s); }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>国道{s.routeNumber}号 {s.name}</div>
              {s.acquiredDate && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.acquiredDate}</div>}
            </div>
          </div>
        ))}
        {tab === 'shop' && shopPhotos.map(sh => (
          <div key={sh.id} className="panel" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(sh.shopImageUrl)}>
            <div style={{ aspectRatio: '1', background: `url(${sh.shopImageUrl}) center/cover no-repeat, var(--panel-2)` }} />
            <div style={{ padding: '8px 10px' }} onClick={(e) => { e.stopPropagation(); onOpen(sh.sticker); }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sh.name || '販売店未登録'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>国道{sh.sticker.routeNumber}号</div>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div style={overlayStyle} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  訪問予定リスト                                                      */
/* ------------------------------------------------------------------ */

function VisitPlanView({ stickers, shops, onOpen }) {
  const planned = shops
    .map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) }))
    .filter(sh => sh.wantToVisit && sh.sticker && !sh.sticker.acquired);
  const revisitPlanned = shops
    .map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) }))
    .filter(sh => sh.revisit && sh.sticker);

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">VISIT PLAN</div>
          <h1>訪問予定リスト</h1>
        </div>
      </header>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">行きたい販売店（未取得・訪問予定）</div>
        {planned.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>訪問予定に登録された販売店はありません。詳細編集画面の販売店ごとに「訪問予定（未訪問）」にチェックを付けると、ここに表示されます。</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {planned.map(sh => (
            <div key={sh.id} className="row" style={{ padding: '10px 4px', cursor: 'pointer' }} onClick={() => onOpen(sh.sticker)}>
              <RouteBadge number={sh.sticker.routeNumber} acquired={false} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{sh.sticker.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {sh.name || '販売店未登録'}{sh.businessHours ? ` ・ ${sh.businessHours}` : ''}{sh.closedDays ? ` (${sh.closedDays})` : ''}
                </div>
              </div>
              <span className="badge badge-pending">未取得</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div className="panel-title">再訪問予定（この店にまた行きたい）</div>
        {revisitPlanned.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>再訪問予定はありません。</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {revisitPlanned.map(sh => (
            <div key={sh.id} className="row" style={{ padding: '10px 4px', cursor: 'pointer' }} onClick={() => onOpen(sh.sticker)}>
              <RouteBadge number={sh.sticker.routeNumber} acquired={sh.sticker.acquired} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{sh.sticker.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sh.name || '販売店未登録'}</div>
              </div>
              <Stars value={sh.sticker.rating} size={13} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  統計                                                                */
/* ------------------------------------------------------------------ */

function StatsView({ stats, stickers, shops }) {
  const pieData = [{ name: '取得済み', value: stats.acquired }, { name: '未取得', value: stats.pending }];

  const methodData = useMemo(() => {
    const counts = {};
    stickers.filter(s => s.acquired).forEach(s => { const m = s.method || '未記入'; counts[m] = (counts[m] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [stickers]);

  const prefCompletion = useMemo(() => {
    const byPref = {};
    shops.forEach(sh => {
      if (!sh.prefecture) return;
      byPref[sh.prefecture] = byPref[sh.prefecture] || new Set();
      byPref[sh.prefecture].add(sh.stickerId);
    });
    return Object.entries(byPref).map(([name, idSet]) => {
      const ids = Array.from(idSet);
      const total = ids.length;
      const acquired = ids.filter(id => stickers.find(s => s.id === id)?.acquired).length;
      return { name, total, acquired, complete: total > 0 && acquired === total };
    }).sort((a, b) => (b.complete - a.complete) || (b.acquired - a.acquired));
  }, [shops, stickers]);

  const regionCompletion = useMemo(() => stats.byRegion.map(r => ({ ...r, complete: r.total > 0 && r.acquired === r.total })), [stats.byRegion]);

  const almostThere = useMemo(() => {
    const prefAlmost = prefCompletion.filter(p => !p.complete && p.total - p.acquired === 1).map(p => ({ ...p, kind: '都道府県' }));
    const regionAlmost = regionCompletion.filter(r => !r.complete && r.total - r.acquired === 1).map(r => ({ ...r, kind: '地域' }));
    return [...prefAlmost, ...regionAlmost];
  }, [prefCompletion, regionCompletion]);

  const timeline = useMemo(() =>
    [...stickers].filter(s => s.acquired && s.acquiredDate).sort((a, b) => a.acquiredDate.localeCompare(b.acquiredDate))
      .map(s => ({ ...s, shopName: shops.find(sh => sh.id === s.acquiredShopId)?.name || '' })),
  [stickers, shops]);

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">STATISTICS</div>
          <h1>統計・グラフ</h1>
        </div>
      </header>

      {almostThere.length > 0 && (
        <div className="panel" style={{ padding: 18, marginBottom: 16, border: '1px solid #E7A400', background: '#FFF8E8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#8a6400', marginBottom: 8 }}>
            <Bell size={16} /> あと1件でコンプリート！
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {almostThere.map(a => (
              <span key={a.kind + a.name} style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 999, background: '#fff', border: '1px solid #E7A400', color: '#8a6400' }}>
                {a.name}（{a.kind}） {a.acquired}/{a.total}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">取得済み / 未取得</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#0B4EA2' : '#C7CCD4'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">都道府県別 取得数ランキング（取得した店舗ベース）</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.prefRanking} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E4DE" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0B4EA2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">地域別 達成状況</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.byRegion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E4DE" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#C7CCD4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="acquired" fill="#0B4EA2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">月別 取得推移</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E4DE" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0B4EA2" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">取得方法の内訳</div>
          {methodData.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>まだ取得記録がありません。</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={methodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E4DE" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B4EA2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        <div className="panel-title">都道府県・地域コンプリートバッジ</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {regionCompletion.map(r => (
            <span key={r.name} className={`complete-badge ${r.complete ? 'done' : ''}`}>
              {r.complete && '🏆 '}{r.name} {r.acquired}/{r.total}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {prefCompletion.map(p => (
            <span key={p.name} className={`complete-badge ${p.complete ? 'done' : ''}`}>
              {p.complete && '🏆 '}{p.name} {p.acquired}/{p.total}
            </span>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        <div className="panel-title">収集履歴タイムライン</div>
        {timeline.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>まだ取得記録がありません。</div>
        ) : (
          <div className="timeline">
            {timeline.map((s, i) => (
              <div key={s.id} className="timeline-item">
                <div className="timeline-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.acquiredDate}（{i + 1}枚目）</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>国道{s.routeNumber}号 {s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.shopName || '販売店未指定'} ・ {s.method}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  設定・バックアップ                                                    */
/* ------------------------------------------------------------------ */

function SettingsView({ onExportJSON, onExportCSV, onImport, onMergeMaster, onReset, onResetAcquisitions, count, onInstall, canInstall }) {
  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">SETTINGS</div>
          <h1>設定・バックアップ</h1>
        </div>
      </header>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">ホーム画面に追加（PWA）</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {canInstall ? 'お使いの端末はインストールに対応しています。' : '実際にご自身のドメインへデプロイした後、対応ブラウザでこのボタンからホーム画面に追加できます。'}
        </p>
        <button className="btn-secondary" onClick={onInstall}><Download size={15} /> ホーム画面に追加</button>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">マスターデータ更新（追加・情報更新のみ）</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          新しい国道ステッカーが追加された場合など、取得済みデータを消さずに国道番号・販売店情報のみを追加/更新できます。
          国道番号・ステッカー名が一致するステッカーは情報のみ更新し、一致しない場合は新規追加されます。販売店も同様に店名で照合します。
        </p>
        <label className="btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer', marginTop: 6 }}>
          <Upload size={15} /> マスターJSONを選択
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={onMergeMaster} />
        </label>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">データ書き出し</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>現在 {count} 件のステッカーが登録されています。</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onExportJSON}><Download size={15} /> JSONで書き出す</button>
          <button className="btn-secondary" onClick={onExportCSV}><Download size={15} /> CSVで書き出す</button>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">データ読み込み（全置き換え）</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>JSON または CSV ファイルを選択すると、現在のデータを置き換えます。</p>
        <label className="btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer', marginTop: 6 }}>
          <Upload size={15} /> ファイルを選択
          <input type="file" accept=".json,.csv" style={{ display: 'none' }} onChange={onImport} />
        </label>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">取得状況だけをリセット</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          登録されているステッカー・販売店の情報はそのまま残し、「取得済み／取得日／評価」などの取得記録だけをすべて未取得の状態に戻します。マスターデータを読み込んだ後、取得枚数を0から数え直したい場合に使ってください。
        </p>
        <button className="btn-secondary" onClick={onResetAcquisitions}><RotateCcw size={15} /> 取得状況を全てリセット</button>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div className="panel-title">データ初期化（全削除）</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>登録されているステッカー・販売店データをすべて削除し、空の状態に戻します。元に戻せません。</p>
        <button className="btn-danger" onClick={onReset}><RotateCcw size={15} /> すべて削除する</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS                                                                 */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

.app-root {
  --primary: #0B4EA2;
  --primary-dark: #063869;
  --paper: #F1EFEA;
  --panel: #FFFFFF;
  --ink: #1A1D22;
  --muted: #767b85;
  --line: #E4E1D9;
  --pending: #B9BDC6;
  --warm: #E7A400;
  --danger: #C0392B;

  display: flex;
  min-height: 640px;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 14px;
}

.app-root * { box-sizing: border-box; }

.sidenav {
  width: 220px; flex-shrink: 0; background: var(--panel);
  border-right: 1px solid var(--line); padding: 18px 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.brand { display: flex; align-items: center; gap: 10px; padding: 6px 8px 20px; }
.navbtn {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 8px; border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 500; color: var(--ink); text-align: left;
}
.navbtn:hover { background: var(--paper); }
.navbtn.active { background: var(--primary); color: #fff; }

.content { flex: 1; padding: 26px 30px; overflow-y: auto; }
.view { max-width: 1080px; }
.view-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.eyebrow { font-size: 11px; letter-spacing: 0.12em; color: var(--primary); font-weight: 700; }
.view h1 { font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 600; margin: 2px 0 0; }

.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
.panel-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }

.hero { display: flex; align-items: center; gap: 26px; padding: 24px; flex-wrap: wrap; }
.hero-ring { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
.hero-ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }

.btn-primary, .btn-secondary, .btn-danger, .link-btn {
  display: inline-flex; align-items: center; gap: 6px; font-family: inherit; font-size: 13px;
  font-weight: 600; border-radius: 8px; cursor: pointer; border: none; padding: 9px 14px;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-secondary { background: var(--paper); color: var(--ink); border: 1px solid var(--line); }
.btn-danger { background: #FBEAE8; color: var(--danger); }
.link-btn { background: none; color: var(--primary); padding: 8px 0; }

.icon-btn { border: none; background: none; cursor: pointer; padding: 4px; display: flex; color: var(--muted); }

.toolbar { display: flex; gap: 10px; padding: 12px; flex-wrap: wrap; align-items: center; }
.search-box { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 220px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; }
.search-box input { border: none; background: none; outline: none; flex: 1; font-family: inherit; font-size: 13px; }
select, input, textarea {
  font-family: inherit; font-size: 13px; padding: 7px 9px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--panel); color: var(--ink); outline: none;
}
select:focus, input:focus, textarea:focus { border-color: var(--primary); }
textarea { resize: vertical; }
.seg { display: flex; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.seg button { border: none; background: var(--panel); padding: 7px 10px; cursor: pointer; color: var(--muted); }
.seg button.active { background: var(--primary); color: #fff; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px; cursor: pointer; transition: box-shadow .15s, transform .15s; }
.card:hover { box-shadow: 0 6px 16px rgba(11,78,162,0.12); transform: translateY(-2px); }

.row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; cursor: pointer; }
.row:hover { background: #FAFAF8; }

.badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; }
.badge-tap { cursor: pointer; padding: 6px 12px; user-select: none; }
.badge-tap:active { transform: scale(0.96); }
.badge-ok { background: #E4F0FF; color: var(--primary); }
.badge-pending { background: #F0F0EE; color: var(--muted); }
.shop-count-badge { font-size: 10px; background: var(--paper); border: 1px solid var(--line); border-radius: 999px; padding: 1px 7px; margin-left: 6px; color: var(--muted); }

.chk { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
.hr { height: 1px; background: var(--line); }

.shop-block { border: 1px solid var(--line); border-radius: 10px; padding: 14px; background: var(--paper); }

.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: #fff; padding: 10px 18px; border-radius: 999px;
  font-size: 13px; z-index: 100; box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}

.map-layout { display: flex; gap: 14px; height: 640px; }
.map-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; overflow: hidden; }
.map-list-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--line); }
.map-list-item:hover { background: #FAFAF8; }
.map-list-item.active { background: #E4F0FF; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 4px; flex-shrink: 0; }
.map-main { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.leaflet-holder { flex: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); min-height: 260px; }
.map-detail { padding: 16px; flex-shrink: 0; }
.map-embed { margin-top: 10px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); height: 220px; }
.map-embed iframe { width: 100%; height: 100%; border: none; }

.complete-badge {
  font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px;
  background: var(--paper); color: var(--muted); border: 1px solid var(--line);
}
.complete-badge.done { background: #FFF6E0; color: #9A6B00; border-color: #F0D48A; }

.timeline { position: relative; padding-left: 18px; margin-top: 10px; }
.timeline::before { content: ''; position: absolute; left: 4px; top: 4px; bottom: 4px; width: 2px; background: var(--line); }
.timeline-item { display: flex; gap: 14px; padding: 10px 0; position: relative; }
.timeline-dot { position: absolute; left: -18px; top: 14px; width: 9px; height: 9px; border-radius: 50%; background: var(--primary); }

.offline-banner {
  background: #FBEAE8; color: var(--danger); font-size: 12px; font-weight: 600;
  padding: 8px 14px; border-radius: 8px; margin-bottom: 14px;
}

@media (max-width: 900px) {
  .map-layout { flex-direction: column; height: auto; }
  .map-sidebar { width: 100%; max-height: 200px; }
  .leaflet-holder { min-height: 320px; }
}

@media (max-width: 720px) {
  .app-root { flex-direction: column; }
  .sidenav { width: 100%; flex-direction: row; border-right: none; border-bottom: 1px solid var(--line); padding: 8px; overflow-x: auto; }
  .brand { display: none; }
  .navbtn span { display: none; }
  .content { padding: 16px; }
}
`;
