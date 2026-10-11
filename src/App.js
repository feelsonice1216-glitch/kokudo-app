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
/* 販売店の地域は、その店舗の都道府県から決める */
const PREF_REGION = {
  '青森県': '東北', '岩手県': '東北', '宮城県': '東北', '秋田県': '東北', '山形県': '東北', '福島県': '東北',
  '茨城県': '関東', '栃木県': '関東', '群馬県': '関東', '埼玉県': '関東', '千葉県': '関東', '東京都': '関東', '神奈川県': '関東',
  '新潟県': '中部', '富山県': '中部', '石川県': '中部', '福井県': '中部', '山梨県': '中部', '長野県': '中部', '岐阜県': '中部', '静岡県': '中部', '愛知県': '中部',
  '三重県': '近畿', '滋賀県': '近畿', '京都府': '近畿', '大阪府': '近畿', '兵庫県': '近畿', '奈良県': '近畿', '和歌山県': '近畿',
  '鳥取県': '中国', '島根県': '中国', '岡山県': '中国', '広島県': '中国', '山口県': '中国',
  '徳島県': '四国', '香川県': '四国', '愛媛県': '四国', '高知県': '四国',
  '福岡県': '九州・沖縄', '佐賀県': '九州・沖縄', '長崎県': '九州・沖縄', '熊本県': '九州・沖縄', '大分県': '九州・沖縄', '宮崎県': '九州・沖縄', '鹿児島県': '九州・沖縄', '沖縄県': '九州・沖縄',
  '北海道': '北海道',
};
const shopRegion = (prefecture) => PREF_REGION[prefecture] || '';
const METHODS = ['現地購入', 'オンライン', 'フリマアプリ', '頂き物', 'その他'];

/* 都道府県庁所在地のおおよその座標（地図の初期表示位置に使用） */
const PREF_COORDS = {
  '北海道': [43.0642, 141.3469], '青森県': [40.8244, 140.7400], '岩手県': [39.7036, 141.1527],
  '宮城県': [38.2688, 140.8721], '秋田県': [39.7186, 140.1024], '山形県': [38.2404, 140.3633],
  '福島県': [37.7503, 140.4676], '茨城県': [36.3418, 140.4468], '栃木県': [36.5658, 139.8836],
  '群馬県': [36.3911, 139.0608], '埼玉県': [35.8569, 139.6489], '千葉県': [35.6047, 140.1233],
  '東京都': [35.6762, 139.6503], '神奈川県': [35.4478, 139.6425], '新潟県': [37.9026, 139.0236],
  '富山県': [36.6953, 137.2113], '石川県': [36.5947, 136.6256], '福井県': [36.0652, 136.2216],
  '山梨県': [35.6642, 138.5684], '長野県': [36.6513, 138.1810], '岐阜県': [35.3912, 136.7223],
  '静岡県': [34.9769, 138.3831], '愛知県': [35.1802, 136.9066], '三重県': [34.7303, 136.5086],
  '滋賀県': [35.0045, 135.8686], '京都府': [35.0212, 135.7556], '大阪府': [34.6863, 135.5200],
  '兵庫県': [34.6913, 135.1830], '奈良県': [34.6851, 135.8330], '和歌山県': [34.2261, 135.1675],
  '鳥取県': [35.5039, 134.2378], '島根県': [35.4723, 133.0505], '岡山県': [34.6618, 133.9350],
  '広島県': [34.3966, 132.4596], '山口県': [34.1859, 131.4714], '徳島県': [34.0658, 134.5593],
  '香川県': [34.3401, 134.0434], '愛媛県': [33.8417, 132.7660], '高知県': [33.5597, 133.5311],
  '福岡県': [33.6064, 130.4183], '佐賀県': [33.2494, 130.2989], '長崎県': [32.7448, 129.8737],
  '熊本県': [32.7898, 130.7417], '大分県': [33.2382, 131.6126], '宮崎県': [31.9111, 131.4239],
  '鹿児島県': [31.5602, 130.5581], '沖縄県': [26.2124, 127.6809],
};

/* 取得日を「26'4月1日」形式にする（YYYY-MM-DD を想定） */
const fmtAcqDateShort = (s) => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || '');
  if (!m) return s || '取得日未入力';
  return `${m[1].slice(2)}'${Number(m[2])}月${Number(m[3])}日`;
};

/* 都道府県コード順（JIS X 0401：01北海道〜47沖縄） */
const PREF_JIS_ORDER = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
const prefJisIndex = (name) => { const i = PREF_JIS_ORDER.indexOf(name); return i === -1 ? 999 : i; };

/* コンビニチェーン判定用（店名にこれらの語を含む場合はコンビニとみなす） */
const CONVENIENCE_KEYWORDS = ['セブン-イレブン', 'セブンイレブン', 'ファミリーマート', 'ローソン', 'セイコーマート', 'ミニストップ', 'デイリーヤマザキ', 'ポプラ', 'セーブオン'];
const isConvenienceStore = (name) => !!name && CONVENIENCE_KEYWORDS.some(k => name.includes(k));

/* "9:00-17:00" のような営業時間の文字列から開始・終了(分)を取り出す。"24時間"は0:00-24:00扱い */
function parseBusinessHours(text) {
  if (!text) return null;
  if (text.includes('乗船便')) return null; // 乗船便による店舗は休業判定・時間絞り込みから除外
  if (text.includes('24時間')) return { openMin: 0, closeMin: 24 * 60, label: text };
  const m = text.match(/(\d{1,2})[:：](\d{2})\s*[-〜~]\s*(\d{1,2})[:：](\d{2})/);
  if (!m) return null;
  const openMin = (+m[1]) * 60 + (+m[2]);
  let closeMin = (+m[3]) * 60 + (+m[4]);
  if (closeMin <= openMin) closeMin += 24 * 60; // 日をまたぐ場合
  return { openMin, closeMin, label: text };
}
const timeToMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
/* 分を「H:MM」表示にする（24時を超える場合は翌日表記） */
const fmtMin = (min) => {
  const next = min >= 24 * 60;
  const base = next ? min - 24 * 60 : min;
  const h = Math.floor(base / 60);
  const m = String(base % 60).padStart(2, '0');
  return `${next ? '翌' : ''}${h}:${m}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

/* 端末に保存する表示・動作設定 */
function usePref(key, defaultValue) {
  const storageKey = 'kokudo-pref-' + key;
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(val)); } catch {}
  }, [storageKey, val]);
  return [val, setVal];
}

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
function useMyLocation(onLocated) {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const locate = () => {
    if (!navigator.geolocation) { setError('この端末では位置情報を利用できません'); return; }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        setLoading(false);
        if (onLocated) onLocated(next);
      },
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
    acquired: false, acquiredDate: '', acquiredShopId: '', method: '', price: '', memo: '', rating: 0, favorite: false, visitedOnly: false,
  };
}

function emptyShop() {
  return {
    id: null, name: '', address: '', prefecture: '', lat: '', lng: '', mapUrl: '',
    businessHours: '', closedDays: '', phone: '', wantToVisit: false, revisit: false, stockChecks: [], shopImageUrl: '',
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
      rows.push({ routeNumber: s.routeNumber, name: s.name, region: s.region, acquired: s.acquired, acquiredDate: s.acquiredDate, method: s.method, price: s.price, rating: s.rating, favorite: s.favorite, visitedOnly: s.visitedOnly, memo: s.memo, shopName: '', address: '', prefecture: '', lat: '', lng: '', businessHours: '', closedDays: '' });
    } else {
      related.forEach(sh => {
        rows.push({ routeNumber: s.routeNumber, name: s.name, region: s.region, acquired: s.acquired, acquiredDate: s.acquiredDate, method: s.method, price: s.price, rating: s.rating, favorite: s.favorite, visitedOnly: s.visitedOnly, memo: s.memo, shopName: sh.name, address: sh.address, prefecture: sh.prefecture, lat: sh.lat, lng: sh.lng, businessHours: sh.businessHours, closedDays: sh.closedDays });
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

function RouteBadge({ number, acquired, status, size = 44 }) {
  const h = Math.round(size * 1.12);
  const showLabel = size >= 30;
  const resolvedStatus = status || (acquired ? 'acquired' : 'pending');
  const fill = resolvedStatus === 'acquired' ? '#0B4EA2' : (resolvedStatus === 'missing' ? '#1A1D22' : '#B9BDC6');
  const textFill = '#fff';
  return (
    <svg
      width={size} height={h} viewBox="0 0 100 110"
      style={{ flexShrink: 0, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
    >
      <path d={ONIGIRI_OUTER_PATH} fill="#fff" />
      <path d={ONIGIRI_INNER_PATH} fill={fill} />
      {showLabel && (
        <>
          <text x="34" y="30" textAnchor="middle" fontFamily="'Noto Sans JP', sans-serif" fontWeight="700" fontSize="13" fill={textFill}>国</text>
          <text x="66" y="30" textAnchor="middle" fontFamily="'Noto Sans JP', sans-serif" fontWeight="700" fontSize="13" fill={textFill}>道</text>
        </>
      )}
      <text
        x="50" y={showLabel ? 62 : 58} textAnchor="middle"
        fontFamily="'Oswald', sans-serif" fontWeight="700"
        fontSize={showLabel ? 30 : 38} fill={textFill}
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
          </div>

          <div className="hr" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <label className="chk">
              <input
                type="checkbox"
                checked={f.acquired}
                onChange={e => {
                  const checked = e.target.checked;
                  setF(prev => {
                    const next = { ...prev, acquired: checked };
                    if (checked && !prev.acquiredShopId && shopsList.length === 1) {
                      next.acquiredShopId = shopsList[0].id || '__new0';
                    }
                    return next;
                  });
                }}
              /> 取得済み
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.favorite} onChange={e => set('favorite', e.target.checked)} /> お気に入り
            </label>
            <label className="chk">
              <input type="checkbox" checked={f.visitedOnly} onChange={e => set('visitedOnly', e.target.checked)} /> 訪問のみ（未購入）
            </label>
          </div>

          {f.acquired && (
            <div style={fieldGrid}>
              <Field label="取得日">
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="date" value={f.acquiredDate} onChange={e => set('acquiredDate', e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-secondary" style={{ flexShrink: 0, padding: '0 10px' }} onClick={() => set('acquiredDate', new Date().toISOString().slice(0, 10))}>今日</button>
                </div>
              </Field>
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
                {shopsList.length === 1 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>この国道は1店舗のみの取り扱いのため、自動的に選択されています。</div>}
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
                <Field label="電話番号"><input value={sh.phone || ''} onChange={e => setShop(idx, 'phone', e.target.value)} placeholder="例: 0123-45-6789" /></Field>
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kokudo-dark-mode') === 'true');
  useEffect(() => { localStorage.setItem('kokudo-dark-mode', String(darkMode)); }, [darkMode]);

  /* 表示・動作設定（表示・動作設定パネルで変更、この端末に保存） */
  const [sortDefaultPref, setSortDefaultPref] = usePref('sortDefault', 'route-asc');
  const [layoutDefaultPref, setLayoutDefaultPref] = usePref('layoutDefault', 'grid');
  const [cardSizePref, setCardSizePref] = usePref('cardSize', 'comfortable');
  const [pageSizePref, setPageSizePref] = usePref('pageSize', '50');
  const [reminderDaysPref, setReminderDaysPref] = usePref('reminderDays', 30);
  const [almostEnabledPref, setAlmostEnabledPref] = usePref('almostEnabled', true);
  const [visitSortPref, setVisitSortPref] = usePref('visitSort', 'registered');
  const [requireTypedConfirmPref, setRequireTypedConfirmPref] = usePref('requireTypedConfirm', false);
  const [themeColorPref, setThemeColorPref] = usePref('themeColor', '#0B4EA2');
  const [fontSizePref, setFontSizePref] = usePref('fontSize', 'normal');
  const [mapStylePref, setMapStylePref] = usePref('mapStyle', 'standard');
  const [mapHomePrefPref, setMapHomePrefPref] = usePref('mapHomePref', '');
  const [chartTypePref, setChartTypePref] = usePref('chartType', 'pie');

  const [layout, setLayout] = useState(layoutDefaultPref);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState(sortDefaultPref);
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
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  /* ホーム画面から開いているか（追加済みか） */
  const isStandalone = (typeof window !== 'undefined') &&
    ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true);
  const isIOS = (typeof navigator !== 'undefined') && /iPhone|iPad|iPod/.test(navigator.userAgent);
  /* 最新版を読み込み直す（URLに時刻を付けて、古い画面の再利用を避ける） */
  const refreshApp = () => {
    const u = new URL(window.location.href);
    u.searchParams.set('v', String(Date.now()));
    window.location.replace(u.toString());
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
      let acquiredShopId = s.acquiredShopId;
      if (nextAcquired && !acquiredShopId) {
        const relatedShops = shops.filter(sh => sh.stickerId === id);
        if (relatedShops.length === 1) acquiredShopId = relatedShops[0].id;
      }
      return {
        ...s,
        acquired: nextAcquired,
        acquiredDate: nextAcquired ? (s.acquiredDate || today) : '',
        acquiredShopId: nextAcquired ? acquiredShopId : s.acquiredShopId,
      };
    }));
  };

  const toggleWantToVisit = (shopId) => {
    setShops(prev => prev.map(sh => sh.id === shopId ? { ...sh, wantToVisit: !sh.wantToVisit } : sh));
  };

  const toggleRevisit = (shopId) => {
    setShops(prev => prev.map(sh => sh.id === shopId ? { ...sh, revisit: !sh.revisit } : sh));
  };

  const exportJSON = () => {
    download(`kokudo-stickers-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ stickers, shops }, null, 2));
    localStorage.setItem('kokudo-last-export', new Date().toISOString());
    showToast('JSONを書き出しました');
  };
  const exportCSV = () => {
    download(`kokudo-stickers-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(toCSVRows(stickers, shops)));
    localStorage.setItem('kokudo-last-export', new Date().toISOString());
    showToast('CSVを書き出しました');
  };

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
          method: r.method || '', price: +r.price || '', rating: +r.rating || 0, favorite: r.favorite === 'true', visitedOnly: r.visitedOnly === 'true', memo: r.memo || '',
          updatedAt: r.acquiredDate || '2026-01-01',
        });
      }
      const sticker = stickerMap.get(key);
      if (r.shopName) {
        const shopId = uid();
        newShops.push({
          id: shopId, stickerId: sticker.id, name: r.shopName, address: r.address || '', prefecture: r.prefecture || '',
          lat: +r.lat || '', lng: +r.lng || '', mapUrl: '', businessHours: r.businessHours || '', closedDays: r.closedDays || '', phone: r.phone || '',
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
            nextShops[idx] = { ...nextShops[idx], address: inc.address ?? nextShops[idx].address, prefecture: inc.prefecture ?? nextShops[idx].prefecture, lat: inc.lat ?? nextShops[idx].lat, lng: inc.lng ?? nextShops[idx].lng, mapUrl: inc.mapUrl ?? nextShops[idx].mapUrl, businessHours: inc.businessHours ?? nextShops[idx].businessHours, closedDays: inc.closedDays ?? nextShops[idx].closedDays, phone: inc.phone ?? nextShops[idx].phone };
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
    if (requireTypedConfirmPref) {
      const typed = prompt('本当にすべてのデータを削除します。元に戻せません。\n続けるには「削除する」と入力してください。');
      if (typed !== '削除する') { if (typed !== null) showToast('入力が一致しなかったため中止しました'); return; }
    } else if (!confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      return;
    }
    setStickers([]);
    setShops([]);
    showToast('データを初期化しました');
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
    <div className={`app-root${darkMode ? ' dark' : ''}${fontSizePref === 'large' ? ' font-large' : ''}`} style={{ '--primary': themeColorPref }}>
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
        <NavBtn icon={<LayoutGrid size={18} />} label="コレクションファイル" active={view === 'collectionfile'} onClick={() => setView('collectionfile')} />
        <NavBtn icon={<CalendarDays size={18} />} label="訪問予定リスト" active={view === 'visitplan'} onClick={() => setView('visitplan')} />
        <NavBtn icon={<Images size={18} />} label="アルバム" active={view === 'album'} onClick={() => setView('album')} />
        <NavBtn icon={<BarChart3 size={18} />} label="統計" active={view === 'stats'} onClick={() => setView('stats')} />
        <NavBtn icon={<Settings size={18} />} label="設定・バックアップ" active={view === 'settings'} onClick={() => setView('settings')} />
      </nav>

      <main className="content">
        {isOffline && <div className="offline-banner">オフラインです。一部の機能が制限される場合があります。</div>}

        {view === 'home' && (
          <HomeView stats={stats} onGoList={() => setView('list')} onAdd={openNew} reminderDays={reminderDaysPref} />
        )}
        {view === 'list' && (
          <ListView
            filtered={filtered} layout={layout} setLayout={setLayout}
            query={query} setQuery={setQuery} filter={filter} setFilter={setFilter}
            sort={sort} setSort={setSort} pageSizePref={pageSizePref} cardSizePref={cardSizePref}
            onOpen={openEditor} onAdd={openNew} onToggleFav={toggleFavorite} onToggleAcquired={toggleAcquired}
          />
        )}
        {view === 'map' && <MapView stickers={stickers} shops={shops} onOpen={openEditor} mapStylePref={mapStylePref} mapHomePref={mapHomePrefPref} />}
        {view === 'collectionfile' && <CollectionFileView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'visitplan' && <VisitPlanView stickers={stickers} shops={shops} onOpen={openEditor} onToggleWantToVisit={toggleWantToVisit} onToggleRevisit={toggleRevisit} visitSortPref={visitSortPref} setVisitSortPref={setVisitSortPref} />}
        {view === 'album' && <AlbumView stickers={stickers} shops={shops} onOpen={openEditor} />}
        {view === 'stats' && <StatsView stats={stats} stickers={stickers} shops={shops} almostEnabled={almostEnabledPref} chartTypePref={chartTypePref} />}
        {view === 'settings' && (
          <SettingsView
            onExportJSON={exportJSON} onExportCSV={exportCSV} onImport={importFile}
            onMergeMaster={mergeMasterData} onReset={resetData} onResetAcquisitions={resetAcquisitions}
            count={stickers.length} onInstall={requestInstall} canInstall={!!installPrompt}
            isStandalone={isStandalone} isIOS={isIOS} onRefresh={refreshApp}
            darkMode={darkMode} onToggleDarkMode={() => setDarkMode(v => !v)}
            sortDefaultPref={sortDefaultPref} setSortDefaultPref={setSortDefaultPref}
            layoutDefaultPref={layoutDefaultPref} setLayoutDefaultPref={setLayoutDefaultPref}
            cardSizePref={cardSizePref} setCardSizePref={setCardSizePref}
            pageSizePref={pageSizePref} setPageSizePref={setPageSizePref}
            reminderDaysPref={reminderDaysPref} setReminderDaysPref={setReminderDaysPref}
            almostEnabledPref={almostEnabledPref} setAlmostEnabledPref={setAlmostEnabledPref}
            requireTypedConfirmPref={requireTypedConfirmPref} setRequireTypedConfirmPref={setRequireTypedConfirmPref}
            themeColorPref={themeColorPref} setThemeColorPref={setThemeColorPref}
            fontSizePref={fontSizePref} setFontSizePref={setFontSizePref}
            mapStylePref={mapStylePref} setMapStylePref={setMapStylePref}
            mapHomePrefPref={mapHomePrefPref} setMapHomePrefPref={setMapHomePrefPref}
            chartTypePref={chartTypePref} setChartTypePref={setChartTypePref}
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

function BackupReminder({ reminderDays }) {
  const [daysSince, setDaysSince] = useState(null);
  useEffect(() => {
    const last = localStorage.getItem('kokudo-last-export');
    if (!last) { setDaysSince(Infinity); return; }
    const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    setDaysSince(Math.floor(diff));
  }, []);
  if (daysSince === null || daysSince < reminderDays) return null;
  return (
    <div className="panel" style={{ padding: 16, marginBottom: 16, border: '1px solid #E7A400', background: '#FFF8E8', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Bell size={16} color="#8a6400" />
      <div style={{ fontSize: 13, color: '#8a6400' }}>
        {daysSince === Infinity ? 'まだデータのバックアップ（書き出し）をしたことがありません。' : `最後のバックアップから${daysSince}日経っています。`}
        機種変更やブラウザのデータ消去で記録が失われる前に、「設定・バックアップ」からJSONを書き出しておくのがおすすめです。
      </div>
    </div>
  );
}

function HomeView({ stats, onGoList, onAdd, reminderDays }) {
  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">DASHBOARD</div>
          <h1>収集の進み具合</h1>
        </div>
        <button className="btn-primary" onClick={onAdd}><Plus size={16} /> ステッカーを登録</button>
      </header>

      <BackupReminder reminderDays={reminderDays} />

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

function ListView({ filtered, layout, setLayout, query, setQuery, filter, setFilter, sort, setSort, pageSizePref, cardSizePref, onOpen, onAdd, onToggleFav, onToggleAcquired }) {
  const [shownCount, setShownCount] = useState(pageSizePref === 'all' ? Infinity : Number(pageSizePref));
  useEffect(() => { setShownCount(pageSizePref === 'all' ? Infinity : Number(pageSizePref)); }, [pageSizePref, query, filter, sort]);
  const visible = filtered.slice(0, shownCount);
  const compact = cardSizePref === 'compact';
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

      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 2px' }}>{filtered.length} 件中 {visible.length} 件表示中</div>

      {layout === 'grid' ? (
        <div className="grid">
          {visible.map(s => {
            const primaryShop = s.acquired ? (s.shopsList.find(sh => sh.id === s.acquiredShopId) || s.shopsList[0]) : s.shopsList[0];
            const extraCount = s.shopsList.length - 1;
            return (
              <div key={s.id} className={`card ${compact ? 'card-compact' : ''}`} onClick={() => onOpen(s)}>
                <div style={{ display: 'flex', gap: compact ? 8 : 12, alignItems: 'center' }}>
                  <RouteBadge number={s.routeNumber} acquired={s.acquired} size={compact ? 28 : undefined} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: compact ? 13 : 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    {!compact && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.region}</div>}
                  </div>
                  <button className="icon-btn" onClick={e => { e.stopPropagation(); onToggleFav(s.id); }}>
                    <Star size={compact ? 14 : 16} fill={s.favorite ? 'var(--warm)' : 'none'} color={s.favorite ? 'var(--warm)' : 'var(--muted)'} />
                  </button>
                </div>
                {!compact && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={12} /> {primaryShop?.name || '販売店未登録'}{extraCount > 0 && <span className="shop-count-badge">他{extraCount}店舗</span>}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: compact ? 6 : 10 }}>
                  <span
                    className={`badge badge-tap ${s.acquired ? 'badge-ok' : 'badge-pending'}`}
                    onClick={e => { e.stopPropagation(); onToggleAcquired(s.id); }}
                  >{s.acquired ? '✓ 取得済み' : (compact ? '未取得' : '未取得（タップで取得）')}</span>
                  <Stars value={s.rating} size={13} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {visible.map((s, i) => {
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

      {shownCount < filtered.length && (
        <button className="btn-secondary" style={{ display: 'block', margin: '16px auto 0' }} onClick={() => setShownCount(c => c + (pageSizePref === 'all' ? Infinity : Number(pageSizePref)))}>
          もっと見る（残り{filtered.length - shownCount}件）
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  販売店マップ                                                        */
/* ------------------------------------------------------------------ */

function useLeaflet() {
  const [ready, setReady] = useState(!!(typeof window !== 'undefined' && window.L && window.L.markerClusterGroup));
  useEffect(() => {
    if (ready) return;
    const finish = () => {
      if (window.L && window.L.markerClusterGroup) setReady(true);
    };
    if (window.L && window.L.markerClusterGroup) { setReady(true); return; }
    if (!document.querySelector('link[data-leaflet-css]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      css.setAttribute('data-leaflet-css', '1');
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[data-cluster-css]')) {
      const css2 = document.createElement('link');
      css2.rel = 'stylesheet';
      css2.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css';
      css2.setAttribute('data-cluster-css', '1');
      document.head.appendChild(css2);
      const css3 = document.createElement('link');
      css3.rel = 'stylesheet';
      css3.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css';
      css3.setAttribute('data-cluster-css2', '1');
      document.head.appendChild(css3);
    }
    const loadClusterScript = () => {
      if (window.L.markerClusterGroup) { finish(); return; }
      if (document.querySelector('script[data-cluster-js]')) {
        const check = setInterval(() => { if (window.L.markerClusterGroup) { clearInterval(check); finish(); } }, 100);
        return;
      }
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js';
      s2.setAttribute('data-cluster-js', '1');
      s2.onload = finish;
      document.body.appendChild(s2);
    };
    if (window.L) { loadClusterScript(); return; }
    if (!document.querySelector('script[data-leaflet-js]')) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.setAttribute('data-leaflet-js', '1');
      script.onload = loadClusterScript;
      document.body.appendChild(script);
    } else {
      const check = setInterval(() => { if (window.L) { clearInterval(check); loadClusterScript(); } }, 100);
    }
  }, [ready]);
  return ready;
}

/* 販売店マップは全国国道マップと同じ仕様（見出しのみ異なる） */
function MapView({ stickers, shops, onOpen, mapStylePref, mapHomePref }) {
  return (
    <NationalMapView
      stickers={stickers}
      shops={shops}
      onOpen={onOpen}
      mapStylePref={mapStylePref}
      mapHomePref={mapHomePref}
      variant="shop"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  全国国道マップ                                                      */
/* ------------------------------------------------------------------ */

function NationalMapView({ stickers, shops, onOpen, mapStylePref, mapHomePref, variant = "national" }) {
  const leafletReady = useLeaflet();
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);
  const layerRef = useRef(null);
  const myMarkerRef = useRef(null);
  const [region, setRegion] = useState('all');
  const [prefecture, setPrefecture] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [convenienceOnly, setConvenienceOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('default');
  const [radiusKm, setRadiusKm] = useState('all');
  const markersRef = useRef({});
  const [openAtOrBefore, setOpenAtOrBefore] = useState('');
  const [closeAtOrAfter, setCloseAtOrAfter] = useState('');
  /* 各店舗の営業時間から、実際にある開店・閉店時刻だけを選択肢にする */
  const { openOptions, closeOptions } = useMemo(() => {
    const opens = new Set();
    const closes = new Set();
    shops.forEach(sh => {
      const bh = parseBusinessHours(sh.businessHours || '');
      if (bh) { opens.add(bh.openMin); closes.add(bh.closeMin); }
    });
    return {
      openOptions: Array.from(opens).sort((a, b) => a - b),
      closeOptions: Array.from(closes).sort((a, b) => a - b),
    };
  }, [shops]);
  const [selectedId, setSelectedId] = useState(null);
  const [highlightKm, setHighlightKm] = useState('10');
  const prefectures = useMemo(() => Array.from(new Set(shops.map(sh => sh.prefecture).filter(Boolean))).sort(), [shops]);

  const joined = useMemo(() =>
    shops.filter(sh => sh.lat && sh.lng).map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) })).filter(sh => sh.sticker),
  [shops, stickers]);

  const [nearbyAlert, setNearbyAlert] = useState(null);

  const handleLocated = (pos) => {
    const km = Number(highlightKm) || 10;
    const near = joined
      .filter(sh => !sh.sticker.acquired)
      .map(sh => ({ ...sh, _d: distanceKm(pos.lat, pos.lng, sh.lat, sh.lng) }))
      .filter(sh => sh._d <= km)
      .sort((a, b) => a._d - b._d);
    setNearbyAlert(near.length > 0 ? near[0] : null);
  };

  const { pos: myPos, error: locError, loading: locLoading, locate } = useMyLocation(handleLocated);

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



  const filtered = useMemo(() => {
    let list = [...joined];
    if (region !== 'all') list = list.filter(sh => shopRegion(sh.prefecture) === region);
    if (prefecture !== 'all') list = list.filter(sh => sh.prefecture === prefecture);
    if (statusFilter === 'acquired') list = list.filter(sh => sh.sticker.acquired);
    if (statusFilter === 'visited') list = list.filter(sh => sh.sticker.visitedOnly && !sh.sticker.acquired);
    if (statusFilter === 'pending') list = list.filter(sh => !sh.sticker.acquired);
    if (convenienceOnly) list = list.filter(sh => (sh.businessHours || '').includes('24時間'));
    if (openAtOrBefore !== '') {
      const t = Number(openAtOrBefore);
      list = list.filter(sh => { const bh = parseBusinessHours(sh.businessHours); return bh && bh.openMin <= t; });
    }
    if (closeAtOrAfter !== '') {
      const t = Number(closeAtOrAfter);
      list = list.filter(sh => { const bh = parseBusinessHours(sh.businessHours); return bh && bh.closeMin >= t; });
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(sh =>
        String(sh.sticker.routeNumber).includes(q) ||
        (sh.sticker.name || '').toLowerCase().includes(q) ||
        (sh.name || '').toLowerCase().includes(q) ||
        (sh.prefecture || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [joined, region, prefecture, statusFilter, convenienceOnly, openAtOrBefore, closeAtOrAfter, query]);

  /* 同じ販売店（同じ店名＋都道府県）を1グループにまとめ、扱っている全ステッカーを保持する */
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach(sh => {
      const key = `${sh.name || '（店名未登録）'}|${sh.prefecture || ''}`;
      if (!map.has(key)) {
        map.set(key, { key, lat: sh.lat, lng: sh.lng, name: sh.name, prefecture: sh.prefecture, mapUrl: sh.mapUrl, items: [] });
      }
      map.get(key).items.push(sh);
    });
    let list = Array.from(map.values());
    if (myPos) {
      list.forEach(g => { g.dist = distanceKm(myPos.lat, myPos.lng, g.lat, g.lng); });
      if (radiusKm !== 'all') list = list.filter(g => g.dist <= Number(radiusKm));
      if (sortMode === 'distance') list = [...list].sort((a, b) => a.dist - b.dist);
    }
    return list;
  }, [filtered, myPos, radiusKm, sortMode]);

  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapObjRef.current) return;
    const L = window.L;
    const center = (mapHomePref && PREF_COORDS[mapHomePref]) || [37.2, 138.0];
    const zoom = (mapHomePref && PREF_COORDS[mapHomePref]) ? 9 : 5;
    const map = L.map(mapDivRef.current, { zoomControl: true }).setView(center, zoom);
    const tileUrl = mapStylePref === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttr = mapStylePref === 'light'
      ? '&copy; OpenStreetMap contributors &copy; CARTO'
      : '&copy; OpenStreetMap contributors';
    L.tileLayer(tileUrl, { attribution: tileAttr, maxZoom: 18 }).addTo(map);
    layerRef.current = L.markerClusterGroup({ maxClusterRadius: 40, spiderfyOnMaxZoom: true }).addTo(map);
    mapObjRef.current = map;
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapObjRef.current || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();
    markersRef.current = {};
    grouped.forEach(group => {
      const items = group.items;
      const isMulti = items.length > 1;
      const isSelected = items.some(sh => sh.sticker.id === selectedId);
      const anyAcquired = items.some(sh => sh.sticker.acquired);
      const allAcquired = items.every(sh => sh.sticker.acquired);
      const anyVisitedOnly = items.some(sh => sh.sticker.visitedOnly && !sh.sticker.acquired);
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const bh = parseBusinessHours(group.items[0]?.businessHours || '');
      const isClosed = bh ? (nowMin < bh.openMin || nowMin >= bh.closeMin) : false;
      const fill = isSelected ? '#C0392B' : isClosed ? '#E74C3C' : (allAcquired ? '#0B4EA2' : (anyAcquired ? '#5B8FD1' : (anyVisitedOnly ? '#8E44AD' : '#B9BDC6')));
      const isNear = myPos && typeof group.dist === 'number' && group.dist <= Number(highlightKm);
      const size = (isSelected ? 36 : 30) + (isNear ? 4 : 0);

      let icon;
      const nearGlow = isNear ? 'filter:drop-shadow(0 0 0 3px #2E9E4F) drop-shadow(0 1px 3px rgba(0,0,0,0.4));' : 'filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));';
      if (isMulti) {
        /* 複数路線を扱う場所：おにぎり型ではなく丸いピンにして、件数バッジを右上に添える（国道番号と混同しないデザイン） */
        const d = size;
        icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${d}px;height:${d}px;">
                   <svg width="${d}" height="${d}" viewBox="0 0 100 100" style="${nearGlow}">
                     <circle cx="50" cy="50" r="46" fill="${isNear ? '#2E9E4F' : '#fff'}" />
                     <circle cx="50" cy="50" r="39" fill="${fill}" />
                     <text x="50" y="60" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-weight="700" font-size="30" fill="#fff">店</text>
                   </svg>
                   <div style="position:absolute;top:-4px;right:-6px;min-width:20px;height:20px;padding:0 4px;border-radius:10px;background:#E7A400;border:2px solid #fff;color:#fff;font-family:'Noto Sans JP',sans-serif;font-weight:700;font-size:11px;line-height:16px;text-align:center;">${items.length}件</div>
                 </div>`,
          iconSize: [d, d], iconAnchor: [d / 2, d / 2],
        });
      } else {
        const h = Math.round(size * 1.12);
        const outerPath = 'M30,4 L70,4 C85,4 96,15 96,32 C96,52 90,64 78,76 L54,101 C52,104 48,104 46,101 L22,76 C10,64 4,52 4,32 C4,15 15,4 30,4 Z';
        const innerPath = 'M32,10 L68,10 C80,10 90,19 90,33 C90,50 85,60 75,70 L52,95 C51,97 49,97 48,95 L25,70 C15,60 10,50 10,33 C10,19 20,10 32,10 Z';
        icon = L.divIcon({
          className: '',
          html: `<svg width="${size}" height="${h}" viewBox="0 0 100 110" style="${nearGlow}">
                   <path d="${outerPath}" fill="${isNear ? '#2E9E4F' : '#fff'}" />
                   <path d="${innerPath}" fill="${fill}" />
                   <text x="34" y="30" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-weight="700" font-size="13" fill="#fff">国</text>
                   <text x="66" y="30" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-weight="700" font-size="13" fill="#fff">道</text>
                   <text x="50" y="62" text-anchor="middle" font-family="'Oswald',sans-serif" font-weight="700" font-size="30" fill="#fff">${items[0].sticker.routeNumber}</text>
                   <text x="50" y="80" text-anchor="middle" font-family="'Oswald',sans-serif" font-weight="500" font-size="11" fill="#fff" letter-spacing="1">ROUTE</text>
                 </svg>`,
          iconSize: [size, h], iconAnchor: [size / 2, h * 0.5],
        });
      }
      const marker = L.marker([group.lat, group.lng], { icon }).addTo(layerRef.current);
      markersRef.current[group.key] = marker;
      const content = document.createElement('div');
      content.style.fontFamily = "'Noto Sans JP', sans-serif";
      content.style.fontSize = '13px';
      content.style.maxHeight = '300px';
      content.style.overflowY = 'auto';
      content.style.minWidth = '200px';
      const header = document.createElement('div');
      header.style.cssText = 'font-weight:600;margin-bottom:2px;';
      header.textContent = group.name || '販売店未登録';
      const sub = document.createElement('div');
      sub.style.cssText = 'color:#767b85;margin-bottom:8px;';
      sub.textContent = `${group.prefecture || ''}${isMulti ? ` ・ 取扱${items.length}路線` : ''}${typeof group.dist === 'number' ? ` ・ 現在地から約${group.dist.toFixed(1)}km` : ''}`;
      content.appendChild(header);
      content.appendChild(sub);
      if (group.mapUrl) {
        const gbtn = document.createElement('button');
        gbtn.textContent = 'Googleマップで開く';
        gbtn.style.cssText = 'width:100%;margin-bottom:8px;padding:6px 10px;border:1px solid #0B4EA2;border-radius:6px;background:#fff;color:#0B4EA2;font-size:12px;font-weight:600;cursor:pointer;';
        gbtn.onclick = () => window.open(group.mapUrl, '_blank');
        content.appendChild(gbtn);
      }
      items
        .slice()
        .sort((a, b) => a.sticker.routeNumber - b.sticker.routeNumber)
        .forEach(sh => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #eee;';
          const left = document.createElement('div');
          left.style.cssText = 'font-size:12px;cursor:pointer;';
          const st = sh.sticker.acquired ? { label: '取得済み', bg: '#E4F0FF', color: '#0B4EA2' }
            : (sh.sticker.visitedOnly ? { label: '訪問のみ', bg: '#F3E8FA', color: '#8E44AD' }
              : { label: '未取得', bg: '#F0F0EE', color: '#767b85' });
          left.innerHTML = `<span style="font-weight:600;">国道${sh.sticker.routeNumber}号</span> ${sh.sticker.name || ''}<br/><span style="display:inline-block;margin-top:2px;font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;background:${st.bg};color:${st.color};">${st.label}</span>`;
          left.onclick = () => { setSelectedId(sh.sticker.id); onOpenRef.current(sh.sticker); };
          row.appendChild(left);
          content.appendChild(row);
        });
      marker.on('click', () => setSelectedId(items[0].sticker.id));
      marker.bindPopup(content);
    });
  }, [grouped, leafletReady, selectedId, myPos, highlightKm]);

  const acquiredCount = new Set(filtered.filter(sh => sh.sticker.acquired).map(sh => sh.sticker.id)).size;

  const focusGroup = (g) => {
    const m = markersRef.current[g.key];
    const map = mapObjRef.current;
    if (!m || !map) return;
    const cl = layerRef.current;
    if (cl && cl.zoomToShowLayer) {
      cl.zoomToShowLayer(m, () => m.openPopup());
    } else {
      map.setView([g.lat, g.lng], 13);
      m.openPopup();
    }
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
      {nearbyAlert && (
        <div className="panel" style={{ padding: 14, marginBottom: 10, border: '1px solid #2E9E4F', background: '#EAF7EE', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Bell size={16} color="#1E7A38" />
          <div style={{ flex: 1, fontSize: 13, color: '#1E7A38', minWidth: 180 }}>
            近くに訪問可能距離の店舗（国道{nearbyAlert.sticker.routeNumber}号 {nearbyAlert.name || '販売店'}）があります。
            {nearbyAlert.businessHours && <span style={{ display: 'block', fontSize: 12, color: '#1E7A38', marginTop: 2 }}>
              営業時間：{nearbyAlert.businessHours}{(() => { const bh = parseBusinessHours(nearbyAlert.businessHours); if (!bh) return ''; const h = String(Math.floor((bh.closeMin % (24*60)) / 60)).padStart(2,'0'); const m = String(bh.closeMin % 60).padStart(2,'0'); return `（閉店 ${h}:${m}）`; })()}
            </span>}
          </div>
          {nearbyAlert.mapUrl && (
            <button className="btn-secondary" onClick={() => window.open(nearbyAlert.mapUrl, '_blank')}>Googleマップを表示</button>
          )}
          <button className="icon-btn" onClick={() => setNearbyAlert(null)}><X size={15} /></button>
        </div>
      )}

      <div className="toolbar panel" style={{ marginBottom: 14 }}>
        <input
          type="search"
          placeholder="店名・国道番号・県で検索"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ minWidth: 200 }}
        />
        {myPos && (
          <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
            <option value="default">並び順：通常</option>
            <option value="distance">並び順：現在地から近い順</option>
          </select>
        )}
        {myPos && (
          <select value={radiusKm} onChange={e => setRadiusKm(e.target.value)}>
            <option value="all">距離：すべて</option>
            <option value="10">現在地から10km以内</option>
            <option value="30">現在地から30km以内</option>
            <option value="50">現在地から50km以内</option>
          </select>
        )}
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
          <option value="visited">訪問のみ</option>
          <option value="pending">未取得のみ</option>
        </select>
        <label className="chk" style={{ fontSize: 13 }}>
          <input type="checkbox" checked={convenienceOnly} onChange={e => setConvenienceOnly(e.target.checked)} /> 24時間営業
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          開店
          <select value={openAtOrBefore} onChange={e => setOpenAtOrBefore(e.target.value)}>
            <option value="">指定なし</option>
            {openOptions.map(m => <option key={m} value={String(m)}>{fmtMin(m)}</option>)}
          </select>
          までに
        </label>
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          閉店
          <select value={closeAtOrAfter} onChange={e => setCloseAtOrAfter(e.target.value)}>
            <option value="">指定なし</option>
            {closeOptions.map(m => <option key={m} value={String(m)}>{fmtMin(m)}</option>)}
          </select>
          以降
        </label>
        {myPos && (
          <select value={highlightKm} onChange={e => setHighlightKm(e.target.value)}>
            <option value="5">現在地から5km以内を強調</option>
            <option value="10">現在地から10km以内を強調</option>
            <option value="20">現在地から20km以内を強調</option>
            <option value="30">現在地から30km以内を強調</option>
            <option value="50">現在地から50km以内を強調</option>
          </select>
        )}
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <span><i className="dot" style={{ background: '#0B4EA2' }} /> 取得済み</span>
          <span><i className="dot" style={{ background: '#8E44AD' }} /> 訪問のみ</span>
          <span><i className="dot" style={{ background: '#B9BDC6' }} /> 未取得</span>
          <span><i className="dot" style={{ background: '#C0392B' }} /> 選択中</span>
          <span><i className="dot" style={{ background: '#E74C3C' }} /> 休業中（営業時間外）</span>
          {myPos && <span><i className="dot" style={{ background: '#2E7D32' }} /> 現在地</span>}
          {myPos && <span><i className="dot" style={{ background: '#fff', border: '2px solid #2E9E4F' }} /> 近くの店舗</span>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '0 2px 10px' }}>
        表示中 {filtered.length} 件（うち取得済みステッカー {acquiredCount} 件）
        {myPos && ` ・ 店舗 ${grouped.length} 件`}
      </div>

      {grouped.length > 0 && (
        <div className="panel" style={{ marginBottom: 12, maxHeight: 240, overflowY: 'auto' }}>
          {grouped.slice(0, 200).map(g => {
            const isMulti = g.items.length > 1;
            const nowM = new Date().getHours() * 60 + new Date().getMinutes();
            const bhL = parseBusinessHours(g.items[0]?.businessHours || '');
            const closedNow = bhL ? (nowM < bhL.openMin || nowM >= bhL.closeMin) : false;
            const nameColor = closedNow ? '#E74C3C' : 'var(--ink)';
            const phoneL = (g.items[0]?.phone || '').trim();
            return (
              <div
                key={g.key}
                onClick={() => focusGroup(g)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--line)', cursor: 'pointer', fontSize: 13 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: nameColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {g.name || '販売店未登録'}
                    {isMulti && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--muted)' }}>（{g.items.length}路線）</span>}
                  </div>
                  {phoneL && (
                    <a
                      href={`tel:${phoneL.replace(/[^0-9+]/g, '')}`}
                      onClick={e => e.stopPropagation()}
                      style={{ display: 'inline-block', fontSize: 12, color: '#0B4EA2', textDecoration: 'underline', marginTop: 2 }}
                    >
                      📞 {phoneL}
                    </a>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {g.prefecture || ''}
                    {' ・ 国道 '}{g.items.map(sh => sh.sticker.routeNumber).sort((a, b) => a - b).join('・')}
                    {typeof g.dist === 'number' && ` ・ 約${g.dist.toFixed(1)}km`}
                  </div>
                </div>
              </div>
            );
          })}
          {grouped.length > 200 && (
            <div style={{ padding: 8, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>上位200件のみ表示しています。絞り込みで件数を減らしてください。</div>
          )}
        </div>
      )}

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
          {tab === 'sticker' ? '画像が登録されたステッカーはまだありません。' : '写真URLが登録された販売店はまだありません。詳細編集画面の販売店ごとに登録できます。'}
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

/* ------------------------------------------------------------------ */
/*  国道ステッカーコレクションファイル（公式台帳風の一覧）                */
/* ------------------------------------------------------------------ */

function CollectionFileView({ stickers, shops, onOpen }) {
  const [regionFilter, setRegionFilter] = useState('all');

  const shopById = useMemo(() => {
    const m = new Map();
    shops.forEach(sh => m.set(sh.id, sh));
    return m;
  }, [shops]);

  const cells = useMemo(() => {
    const byNumber = new Map();
    stickers.forEach(s => { byNumber.set(s.routeNumber, s); });
    const maxNumber = stickers.reduce((m, s) => Math.max(m, s.routeNumber), 0);
    const list = [];
    for (let n = 1; n <= maxNumber; n++) {
      const s = byNumber.get(n);
      if (!s) {
        list.push({ n, status: 'missing', sticker: null });
      } else {
        list.push({ n, status: s.acquired ? 'acquired' : 'pending', sticker: s });
      }
    }
    return list;
  }, [stickers]);

  const filteredCells = useMemo(() => {
    if (regionFilter === 'all') return cells;
    return cells.filter(c => c.sticker && c.sticker.region === regionFilter);
  }, [cells, regionFilter]);

  const acquiredCount = cells.filter(c => c.status === 'acquired').length;
  const missingCount = cells.filter(c => c.status === 'missing').length;
  const totalReal = cells.length - missingCount;

  const PER_PAGE = 24; // 縦4行 × 横6列
  const pages = useMemo(() => {
    const arr = [];
    for (let i = 0; i < filteredCells.length; i += PER_PAGE) arr.push(filteredCells.slice(i, i + PER_PAGE));
    return arr;
  }, [filteredCells]);

  const [pageIndex, setPageIndex] = useState(0);
  const [infoCell, setInfoCell] = useState(null); // { sticker, shopName } | null
  const [flipDir, setFlipDir] = useState(null); // 'next' | 'prev' | null
  const [flipping, setFlipping] = useState(false);
  useEffect(() => { setPageIndex(0); }, [regionFilter]);
  useEffect(() => { if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1)); }, [pages.length, pageIndex]);

  const goTo = (nextIndex, dir) => {
    if (flipping || nextIndex < 0 || nextIndex > pages.length - 1) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setPageIndex(nextIndex);
      setTimeout(() => { setFlipping(false); setFlipDir(null); }, 380);
    }, 10);
  };

  const renderPage = (page, pi) => (
    <div className="binder-page">
      <div className="binder-page-head">第{pi + 1}ページ　（No.{page[0].n}〜No.{page[page.length - 1].n}）</div>
      <div className="binder-grid">
        {page.map(c => {
          const shop = c.sticker?.acquiredShopId ? shopById.get(c.sticker.acquiredShopId) : null;
          return (
            <div
              key={c.n}
              className={`binder-cell ${c.status}`}
              onClick={() => {
                if (!c.sticker) return;
                if (c.status === 'acquired') { setInfoCell({ sticker: c.sticker, shopName: shop?.name || '' }); return; }
                onOpen(c.sticker);
              }}
              title={c.sticker ? c.sticker.name : `国道${c.n}号（欠番）`}
            >
              <RouteBadge number={c.n} status={c.status} size={48} />
              {c.status === 'acquired' && (
                <div className="binder-cell-info">
                  <div
                    className="line date"
                    style={{ cursor: 'pointer', textDecoration: 'underline dotted', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' }}
                    onClick={e => { e.stopPropagation(); setInfoCell({ sticker: c.sticker, shopName: shop?.name || '' }); }}
                  >
                    {fmtAcqDateShort(c.sticker.acquiredDate)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {Array.from({ length: PER_PAGE - page.length }).map((_, i) => (
          <div key={`empty${i}`} className="binder-cell empty" />
        ))}
      </div>
    </div>
  );

  const currentPage = pages[pageIndex];

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">COLLECTION FILE</div>
          <h1>コレクションファイル</h1>
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="all">地域：すべて</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </header>

      <div className="panel" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
        <span><i className="dot" style={{ background: '#0B4EA2' }} /> 取得済み（{acquiredCount}/{totalReal}）</span>
        <span><i className="dot" style={{ background: '#B9BDC6' }} /> 未取得</span>
        <span><i className="dot" style={{ background: '#1A1D22' }} /> 欠番（{missingCount}）</span>
      </div>

      {currentPage && (
        <div className="binder-flip-stage">
          <div className={`binder-flip-page ${flipping ? (flipDir === 'next' ? 'flip-next' : 'flip-prev') : ''}`}>
            {renderPage(currentPage, pageIndex)}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 14 }}>
        <button className="btn-secondary" onClick={() => goTo(pageIndex - 1, 'prev')} disabled={pageIndex === 0 || flipping}>← 前のページ</button>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{pageIndex + 1} / {pages.length} ページ</span>
        <button className="btn-secondary" onClick={() => goTo(pageIndex + 1, 'next')} disabled={pageIndex === pages.length - 1 || flipping}>次のページ →</button>
      </div>

      {infoCell && (
        <div style={overlayStyle} onClick={() => setInfoCell(null)}>
          <div
            className="panel"
            onClick={e => e.stopPropagation()}
            style={{ width: 'min(92vw, 360px)', padding: 20, borderRadius: 14, background: 'var(--panel)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>ステッカー情報</div>
              <button className="icon-btn" onClick={() => setInfoCell(null)}><X size={16} /></button>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', margin: 0, fontSize: 13 }}>
              <dt style={{ color: 'var(--muted)' }}>ステッカー名</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>国道{infoCell.sticker.routeNumber}号 {infoCell.sticker.name || ''}</dd>
              <dt style={{ color: 'var(--muted)' }}>地域</dt>
              <dd style={{ margin: 0 }}>{infoCell.sticker.region || '未入力'}</dd>
              <dt style={{ color: 'var(--muted)' }}>取得日</dt>
              <dd style={{ margin: 0 }}>{infoCell.sticker.acquiredDate || '未入力'}</dd>
              <dt style={{ color: 'var(--muted)' }}>取得店</dt>
              <dd style={{ margin: 0 }}>{infoCell.shopName || '未入力'}</dd>
              <dt style={{ color: 'var(--muted)' }}>メモ</dt>
              <dd style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{infoCell.sticker.memo || '未入力'}</dd>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function VisitPlanView({ stickers, shops, onOpen, onToggleWantToVisit, onToggleRevisit, visitSortPref, setVisitSortPref }) {
  const [query, setQuery] = useState('');
  const [prefFilter, setPrefFilter] = useState('all');

  const sortItems = (list) => {
    if (visitSortPref === 'prefecture') return [...list].sort((a, b) => (a.prefecture || '').localeCompare(b.prefecture || '', 'ja'));
    return list;
  };

  const planned = sortItems(shops
    .map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) }))
    .filter(sh => sh.wantToVisit && sh.sticker && !sh.sticker.acquired));
  const revisitPlanned = sortItems(shops
    .map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) }))
    .filter(sh => sh.revisit && sh.sticker));

  const allJoined = useMemo(() =>
    shops.map(sh => ({ ...sh, sticker: stickers.find(s => s.id === sh.stickerId) })).filter(sh => sh.sticker),
  [shops, stickers]);

  const prefectures = useMemo(() => Array.from(new Set(shops.map(sh => sh.prefecture).filter(Boolean))).sort(), [shops]);

  const searchResults = useMemo(() => {
    if (!query.trim() && prefFilter === 'all') return [];
    let list = allJoined;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(sh =>
        String(sh.sticker.routeNumber).includes(q) ||
        sh.name?.toLowerCase().includes(q) ||
        sh.prefecture?.toLowerCase().includes(q)
      );
    }
    if (prefFilter !== 'all') list = list.filter(sh => sh.prefecture === prefFilter);
    return list.slice(0, 50);
  }, [allJoined, query, prefFilter]);

  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">VISIT PLAN</div>
          <h1>訪問予定リスト</h1>
        </div>
        <select value={visitSortPref} onChange={e => setVisitSortPref(e.target.value)}>
          <option value="registered">並び順：登録順</option>
          <option value="prefecture">並び順：都道府県順</option>
        </select>
      </header>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">販売店を検索して追加</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <div className="search-box" style={{ flex: 2, minWidth: 200 }}>
            <Search size={15} color="var(--muted)" />
            <input placeholder="国道番号・店舗名で検索" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select value={prefFilter} onChange={e => setPrefFilter(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
            <option value="all">都道府県：すべて</option>
            {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {(query.trim() || prefFilter !== 'all') && (
          <div style={{ marginTop: 10, maxHeight: 280, overflowY: 'auto' }}>
            {searchResults.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 4px' }}>該当する販売店がありません。</div>}
            {searchResults.map(sh => (
              <div key={sh.id} className="row" style={{ padding: '8px 4px' }}>
                <RouteBadge number={sh.sticker.routeNumber} acquired={sh.sticker.acquired} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sh.name || '販売店未登録'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>国道{sh.sticker.routeNumber}号 ・ {sh.prefecture}</div>
                </div>
                {sh.sticker.acquired ? (
                  <button className={`chip-toggle ${sh.revisit ? 'on' : ''}`} onClick={() => onToggleRevisit(sh.id)}>
                    {sh.revisit ? '再訪問済み✓' : '再訪問予定に追加'}
                  </button>
                ) : (
                  <button className={`chip-toggle ${sh.wantToVisit ? 'on' : ''}`} onClick={() => onToggleWantToVisit(sh.id)}>
                    {sh.wantToVisit ? '追加済み✓' : '訪問予定に追加'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">行きたい販売店（未取得・訪問予定）</div>
        {planned.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>訪問予定に登録された販売店はありません。上の検索から追加するか、詳細編集画面の販売店ごとに「訪問予定（未訪問）」にチェックを付けると、ここに表示されます。</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {planned.map(sh => (
            <div key={sh.id} className="row" style={{ padding: '10px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen(sh.sticker)}>
                <RouteBadge number={sh.sticker.routeNumber} acquired={false} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{sh.sticker.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {sh.name || '販売店未登録'}{sh.businessHours ? ` ・ ${sh.businessHours}` : ''}{sh.closedDays ? ` (${sh.closedDays})` : ''}
                  </div>
                </div>
              </div>
              <button className="chip-toggle on" onClick={() => onToggleWantToVisit(sh.id)} title="訪問予定から外す"><X size={12} /> 外す</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: 20 }}>
        <div className="panel-title">再訪問予定（この店にまた行きたい）</div>
        {revisitPlanned.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>再訪問予定はありません。</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {revisitPlanned.map(sh => (
            <div key={sh.id} className="row" style={{ padding: '10px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen(sh.sticker)}>
                <RouteBadge number={sh.sticker.routeNumber} acquired={sh.sticker.acquired} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{sh.sticker.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sh.name || '販売店未登録'}</div>
                </div>
                <Stars value={sh.sticker.rating} size={13} />
              </div>
              <button className="chip-toggle on" onClick={() => onToggleRevisit(sh.id)} title="再訪問予定から外す"><X size={12} /> 外す</button>
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

function StatsView({ stats, stickers, shops, almostEnabled, chartTypePref }) {
  const pieData = [{ name: '取得済み', value: stats.acquired }, { name: '未取得', value: stats.pending }];

  const thisMonthCount = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7);
    return stickers.filter(s => s.acquired && s.acquiredDate && s.acquiredDate.slice(0, 7) === ym).length;
  }, [stickers]);

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

  const [rankSort, setRankSort] = useState('code');
  const remainingRanking = useMemo(() => {
    const list = prefCompletion
      .map(p => ({ ...p, remaining: p.total - p.acquired }));
    if (rankSort === 'remainingAsc') return list.sort((a, b) => a.remaining - b.remaining || prefJisIndex(a.name) - prefJisIndex(b.name));
    if (rankSort === 'remainingDesc') return list.sort((a, b) => b.remaining - a.remaining || prefJisIndex(a.name) - prefJisIndex(b.name));
    return list.sort((a, b) => prefJisIndex(a.name) - prefJisIndex(b.name));
  }, [prefCompletion, rankSort]);

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

      {almostEnabled && almostThere.length > 0 && (
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 16, marginBottom: 16 }}>
        <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>今月の取得数</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{thisMonthCount}<span style={{ fontSize: 13, fontWeight: 500 }}>枚</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
        <div className="panel" style={{ padding: 20 }}>
          <div className="panel-title">取得済み / 未取得</div>
          <ResponsiveContainer width="100%" height={220}>
            {chartTypePref === 'bar' ? (
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E4DE" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#0B4EA2' : '#C7CCD4'} />)}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#0B4EA2' : '#C7CCD4'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
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
        <div className="panel-title">都道府県別 残り枚数ランキング</div>
        <div style={{ marginTop: 8 }}>
          <select value={rankSort} onChange={e => setRankSort(e.target.value)}>
            <option value="code">並び順：都道府県コード順（北から南）</option>
            <option value="remainingAsc">並び順：残り枚数が少ない順</option>
            <option value="remainingDesc">並び順：残り枚数が多い順</option>
          </select>
        </div>
        {remainingRanking.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>すべての都道府県でコンプリートしています！</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {remainingRanking.map((p, i) => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ width: 22, color: 'var(--muted)', fontWeight: 600 }}>{rankSort === 'code' ? prefJisIndex(p.name) + 1 : i + 1}</span>
                <span style={{ width: 70, fontWeight: 500 }}>{p.name}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#EEEEEA', overflow: 'hidden' }}>
                  <div style={{ width: `${(p.acquired / p.total) * 100}%`, height: '100%', background: '#0B4EA2' }} />
                </div>
                <span style={{ width: 90, textAlign: 'right', color: p.remaining === 0 ? '#0B4EA2' : 'var(--muted)', fontWeight: p.remaining === 0 ? 700 : 400, fontSize: 12 }}>{p.remaining === 0 ? 'コンプリート' : `残り${p.remaining}枚`}（{p.acquired}/{p.total}）</span>
              </div>
            ))}
          </div>
        )}
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
                  <div style={{ fontWeight: 500, fontSize: 14 }}>国道{s.routeNumber}号</div>
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

function SettingsView({
  onExportJSON, onExportCSV, onImport, onMergeMaster, onReset, onResetAcquisitions, count, onInstall, canInstall, isStandalone, isIOS, onRefresh, darkMode, onToggleDarkMode,
  sortDefaultPref, setSortDefaultPref, layoutDefaultPref, setLayoutDefaultPref, cardSizePref, setCardSizePref,
  pageSizePref, setPageSizePref, reminderDaysPref, setReminderDaysPref, almostEnabledPref, setAlmostEnabledPref,
  requireTypedConfirmPref, setRequireTypedConfirmPref, themeColorPref, setThemeColorPref, fontSizePref, setFontSizePref,
  mapStylePref, setMapStylePref, mapHomePrefPref, setMapHomePrefPref, chartTypePref, setChartTypePref,
}) {
  return (
    <div className="view">
      <header className="view-header">
        <div>
          <div className="eyebrow">SETTINGS</div>
          <h1>設定・バックアップ</h1>
        </div>
      </header>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">ホーム画面に追加・更新</div>
        {isStandalone ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              ホーム画面に追加済みです。アプリの内容を最新版に更新できます。
            </p>
            <button className="btn-secondary" onClick={onRefresh}><RotateCcw size={15} /> 最新版に更新</button>
          </>
        ) : canInstall ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>このままボタンを押すと、ホーム画面に追加できます。</p>
            <button className="btn-secondary" onClick={onInstall}><Download size={15} /> ホーム画面に追加</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              {isIOS
                ? 'iPhone・iPadでは、Safariの画面下の「共有」ボタン（□に↑）→「ホーム画面に追加」で追加できます。'
                : 'ブラウザのメニューから「ホーム画面に追加」（またはアプリのインストール）を選ぶと追加できます。'}
            </p>
            <button className="btn-secondary" onClick={onRefresh}><RotateCcw size={15} /> 最新版を読み込む</button>
          </>
        )}
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">表示テーマ</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>ダークモードのオン・オフを切り替えます。設定はこの端末に保存されます。</p>
        <button className="btn-secondary" onClick={onToggleDarkMode}>
          {darkMode ? '☀️ ライトモードに切り替え' : '🌙 ダークモードに切り替え'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span style={{ fontSize: 13 }}>メインカラー</span>
          <input type="color" value={themeColorPref} onChange={e => setThemeColorPref(e.target.value)} style={{ width: 44, height: 30, padding: 0, border: 'none', background: 'none' }} />
          <button className="btn-secondary" onClick={() => setThemeColorPref('#0B4EA2')}>初期色に戻す</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13 }}>文字サイズ</span>
          <select value={fontSizePref} onChange={e => setFontSizePref(e.target.value)}>
            <option value="normal">標準</option>
            <option value="large">大きめ</option>
          </select>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">一覧の表示設定</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>「ステッカー一覧」を開いたときの初期状態です。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
          <label style={{ fontSize: 13 }}>初期の並び順
            <select value={sortDefaultPref} onChange={e => setSortDefaultPref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="route-asc">国道番号順</option>
              <option value="route-desc">国道番号（降順）</option>
              <option value="prefecture">都道府県順</option>
              <option value="region">地域順</option>
              <option value="acquired-date">取得日順</option>
              <option value="updated">更新日順</option>
              <option value="shop">販売店順</option>
              <option value="favorite">お気に入り順</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>初期の表示形式
            <select value={layoutDefaultPref} onChange={e => setLayoutDefaultPref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="grid">カード表示</option>
              <option value="list">リスト表示</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>カードの大きさ
            <select value={cardSizePref} onChange={e => setCardSizePref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="comfortable">大きめ</option>
              <option value="compact">コンパクト</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>一度に表示する件数
            <select value={pageSizePref} onChange={e => setPageSizePref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="20">20件</option>
              <option value="50">50件</option>
              <option value="100">100件</option>
              <option value="all">すべて</option>
            </select>
          </label>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>お気に入り店舗だけを都道府県順に見たい場合は、一覧画面の絞り込みで「お気に入りのみ」、並び順で「都道府県順」を選ぶと同じことができます。</p>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">地図の表示設定</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
          <label style={{ fontSize: 13 }}>地図のデザイン
            <select value={mapStylePref} onChange={e => setMapStylePref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="standard">標準</option>
              <option value="light">淡色</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>地図を開いた時の初期位置
            <select value={mapHomePrefPref} onChange={e => setMapHomePrefPref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="">全国を表示</option>
              {Object.keys(PREF_COORDS).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">統計・通知の設定</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
          <label style={{ fontSize: 13 }}>取得済み/未取得グラフの種類
            <select value={chartTypePref} onChange={e => setChartTypePref(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="pie">円グラフ</option>
              <option value="bar">棒グラフ</option>
            </select>
          </label>
          <label style={{ fontSize: 13 }}>バックアップ通知の間隔
            <select value={reminderDaysPref} onChange={e => setReminderDaysPref(Number(e.target.value))} style={{ width: '100%', marginTop: 4 }}>
              <option value={7}>7日</option>
              <option value={14}>14日</option>
              <option value={30}>30日</option>
              <option value={60}>60日</option>
              <option value={9999}>通知しない</option>
            </select>
          </label>
        </div>
        <label className="chk" style={{ marginTop: 12, display: 'inline-flex' }}>
          <input type="checkbox" checked={almostEnabledPref} onChange={e => setAlmostEnabledPref(e.target.checked)} /> 「あと1件でコンプリート」通知を統計画面に表示する
        </label>
      </div>

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title">安全設定</div>
        <label className="chk">
          <input type="checkbox" checked={requireTypedConfirmPref} onChange={e => setRequireTypedConfirmPref(e.target.checked)} /> 「データ初期化」実行前に確認テキストの入力を必須にする
        </label>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>オンにすると、初期化の際に「削除する」と入力しないと実行できなくなります。</p>
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

.app-root.dark {
  --paper: #14171C;
  --panel: #1D2128;
  --ink: #EDEFF2;
  --muted: #9AA0AC;
  --line: #303640;
  --pending: #4A505B;
}
.app-root.dark .btn-secondary { background: var(--panel); color: var(--ink); border-color: var(--line); }
.app-root.dark input, .app-root.dark select, .app-root.dark textarea { background: var(--panel); color: var(--ink); border-color: var(--line); }
.app-root.dark .panel { background: var(--panel); }
.app-root.dark .complete-badge { background: #262B33; }
.app-root.font-large { font-size: 16px; }
.app-root.font-large h1 { font-size: 1.15em; }
.card-compact { padding: 10px !important; }

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
.chip-toggle { flex-shrink: 0; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: var(--muted); cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.chip-toggle.on { background: #0B4EA2; color: #fff; border-color: #0B4EA2; }

.binder-page { background: #2B2E33; border-radius: 16px; padding: 18px; margin-bottom: 22px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); }
.binder-page-head { font-size: 12px; font-weight: 700; color: #E4E6EA; margin-bottom: 12px; letter-spacing: 1px; }
.binder-grid { display: flex; flex-wrap: wrap; background: #1D2024; border-radius: 8px; padding: 8px; }
.binder-cell { width: 16.6666%; box-sizing: border-box; padding: 6px; display: flex; flex-direction: column; align-items: center; }
.binder-cell.empty { visibility: hidden; }
.binder-cell:not(.empty) { cursor: pointer; }
.binder-cell-inner, .binder-cell > svg { background: #fff; border-radius: 8px; }
.binder-cell-info { width: 100%; margin-top: 4px; background: #fff; border-radius: 0 0 6px 6px; padding: 3px 4px 5px; text-align: center; }
.binder-cell .line { font-size: 9px; line-height: 1.35; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.binder-cell .line.date { color: #0B4EA2; font-weight: 700; }
.binder-cell .line.kaido { color: #9a6b00; }
.binder-cell > svg { padding: 4px; }

.binder-flip-stage { perspective: 1800px; }
.binder-flip-page { transform-origin: left center; transform-style: preserve-3d; transition: transform 0.38s ease, box-shadow 0.38s ease; }
.binder-flip-page.flip-next { transform: rotateY(-18deg) scale(0.97); box-shadow: -20px 10px 30px rgba(0,0,0,0.35); }
.binder-flip-page.flip-prev { transform: rotateY(18deg) scale(0.97); box-shadow: 20px 10px 30px rgba(0,0,0,0.35); }
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
