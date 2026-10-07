/*
 * PokéRogue 存档改造工具 v1.12.0.11
 * 版本号与 PokéRogue 游戏版本保持一致
 *
 * 实现要点:
 *   - 双写: 同时写 localStorage 加密 cache 和 server, 防止游戏回传覆盖
 *   - species 配对: 蛋的 tier 必须配合具体 species, 否则游戏会随机分配
 *   - timestamp 未来化: 确保本地 cache 优先
 *
 * 用法:
 *   1. 在 pokerogue.net 的 F12 Console 粘贴此脚本
 *   2. 在游戏里点一下"加载游戏"触发请求 (捕获 CSID)
 *   3. 调用 PRG.XXX()
 *   4. 改完 F5 刷新页面
 */
(async () => {
  const API = 'https://api.pokerogue.net';
  const SID = document.cookie.split('pokerogue_sessionId=')[1]?.split(';')[0];
  if (!SID) { console.error('[PRG] 未检测到登录 cookie, 请先登录 pokerogue.net'); return; }

  if (!window.__PRG_rawFetch) window.__PRG_rawFetch = window.fetch.bind(window);
  const rawFetch = window.__PRG_rawFetch;

  /* ===== CSID 捕获 ===== */
  if (!window.__PRGFetchPatched) {
    window.__PRGFetchPatched = true;
    window.__PRGCapturedCSID = null;
    const CSID_REGEX = /[?&]clientSessionId=([^&\s"'<>]+)/;
    const captureCSID = (url) => {
      try {
        const u = typeof url === 'string' ? url : url?.url;
        if (!u) return;
        const m = u.match(CSID_REGEX);
        if (!m) return;
        const val = decodeURIComponent(m[1]);
        if (val !== window.__PRGCapturedCSID) {
          window.__PRGCapturedCSID = val;
          console.log(`[PRG] 捕获到活跃 clientSessionId`);
        }
      } catch (e) {}
    };
    const origFetch = window.fetch;
    window.fetch = function(url) { captureCSID(url); return origFetch.apply(this, arguments); };
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) { captureCSID(url); return origOpen.call(this, method, url, ...rest); };
  }

  /* ===== 用户名 ===== */
  const USERNAME = Object.keys(localStorage).find(k => k.startsWith('data_'))?.replace('data_', '') || 'unknown';
  const LOCAL_KEY = `data_${USERNAME}`;
  const SECRET = 'x0i2O7WRiANTqPmZ';

  /* ===== 纯 JS MD5（经测试通过） ===== */
  function md5(bytes) {
    const rotateLeft = (x, n) => (x << n) | (x >>> (32 - n));
    const addUnsigned = (x, y) => {
      const x4 = x & 0x40000000; const y4 = y & 0x40000000;
      const x8 = x & 0x80000000; const y8 = y & 0x80000000;
      const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
      if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) { if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8; return result ^ 0x40000000 ^ x8 ^ y8; }
      return result ^ x8 ^ y8;
    };
    const F=(x,y,z)=>(x&y)|((~x)&z); const G=(x,y,z)=>(x&z)|(y&(~z));
    const H=(x,y,z)=>x^y^z; const I=(x,y,z)=>y^(x|(~z));
    const FF=(a,b,c,d,x,s,ac)=>{a=addUnsigned(a,addUnsigned(addUnsigned(F(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);};
    const GG=(a,b,c,d,x,s,ac)=>{a=addUnsigned(a,addUnsigned(addUnsigned(G(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);};
    const HH=(a,b,c,d,x,s,ac)=>{a=addUnsigned(a,addUnsigned(addUnsigned(H(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);};
    const II=(a,b,c,d,x,s,ac)=>{a=addUnsigned(a,addUnsigned(addUnsigned(I(b,c,d),x),ac));return addUnsigned(rotateLeft(a,s),b);};
    const len = bytes.length;
    const numBlocks = ((len + 8) >> 6) + 1;
    const blocks = new Uint32Array(numBlocks * 16);
    for (let i = 0; i < len; i++) blocks[i >> 2] |= bytes[i] << ((i & 3) * 8);
    blocks[len >> 2] |= 0x80 << ((len & 3) * 8);
    blocks[blocks.length - 2] = len << 3;
    let a=0x67452301, b=0xefcdab89, c=0x98badcfe, d=0x10325476;
    const S11=7,S12=12,S13=17,S14=22,S21=5,S22=9,S23=14,S24=20,S31=4,S32=11,S33=16,S34=23,S41=6,S42=10,S43=15,S44=21;
    for (let k = 0; k < blocks.length; k += 16) {
      const AA=a,BB=b,CC=c,DD=d;
      a=FF(a,b,c,d,blocks[k+0],S11,0xD76AA478);d=FF(d,a,b,c,blocks[k+1],S12,0xE8C7B756);c=FF(c,d,a,b,blocks[k+2],S13,0x242070DB);b=FF(b,c,d,a,blocks[k+3],S14,0xC1BDCEEE);
      a=FF(a,b,c,d,blocks[k+4],S11,0xF57C0FAF);d=FF(d,a,b,c,blocks[k+5],S12,0x4787C62A);c=FF(c,d,a,b,blocks[k+6],S13,0xA8304613);b=FF(b,c,d,a,blocks[k+7],S14,0xFD469501);
      a=FF(a,b,c,d,blocks[k+8],S11,0x698098D8);d=FF(d,a,b,c,blocks[k+9],S12,0x8B44F7AF);c=FF(c,d,a,b,blocks[k+10],S13,0xFFFF5BB1);b=FF(b,c,d,a,blocks[k+11],S14,0x895CD7BE);
      a=FF(a,b,c,d,blocks[k+12],S11,0x6B901122);d=FF(d,a,b,c,blocks[k+13],S12,0xFD987193);c=FF(c,d,a,b,blocks[k+14],S13,0xA679438E);b=FF(b,c,d,a,blocks[k+15],S14,0x49B40821);
      a=GG(a,b,c,d,blocks[k+1],S21,0xF61E2562);d=GG(d,a,b,c,blocks[k+6],S22,0xC040B340);c=GG(c,d,a,b,blocks[k+11],S23,0x265E5A51);b=GG(b,c,d,a,blocks[k+0],S24,0xE9B6C7AA);
      a=GG(a,b,c,d,blocks[k+5],S21,0xD62F105D);d=GG(d,a,b,c,blocks[k+10],S22,0x2441453);c=GG(c,d,a,b,blocks[k+15],S23,0xD8A1E681);b=GG(b,c,d,a,blocks[k+4],S24,0xE7D3FBC8);
      a=GG(a,b,c,d,blocks[k+9],S21,0x21E1CDE6);d=GG(d,a,b,c,blocks[k+14],S22,0xC33707D6);c=GG(c,d,a,b,blocks[k+3],S23,0xF4D50D87);b=GG(b,c,d,a,blocks[k+8],S24,0x455A14ED);
      a=GG(a,b,c,d,blocks[k+13],S21,0xA9E3E905);d=GG(d,a,b,c,blocks[k+2],S22,0xFCEFA3F8);c=GG(c,d,a,b,blocks[k+7],S23,0x676F02D9);b=GG(b,c,d,a,blocks[k+12],S24,0x8D2A4C8A);
      a=HH(a,b,c,d,blocks[k+5],S31,0xFFFA3942);d=HH(d,a,b,c,blocks[k+8],S32,0x8771F681);c=HH(c,d,a,b,blocks[k+11],S33,0x6D9D6122);b=HH(b,c,d,a,blocks[k+14],S34,0xFDE5380C);
      a=HH(a,b,c,d,blocks[k+1],S31,0xA4BEEA44);d=HH(d,a,b,c,blocks[k+4],S32,0x4BDECFA9);c=HH(c,d,a,b,blocks[k+7],S33,0xF6BB4B60);b=HH(b,c,d,a,blocks[k+10],S34,0xBEBFBC70);
      a=HH(a,b,c,d,blocks[k+13],S31,0x289B7EC6);d=HH(d,a,b,c,blocks[k+0],S32,0xEAA127FA);c=HH(c,d,a,b,blocks[k+3],S33,0xD4EF3085);b=HH(b,c,d,a,blocks[k+6],S34,0x4881D05);
      a=HH(a,b,c,d,blocks[k+9],S31,0xD9D4D039);d=HH(d,a,b,c,blocks[k+12],S32,0xE6DB99E5);c=HH(c,d,a,b,blocks[k+15],S33,0x1FA27CF8);b=HH(b,c,d,a,blocks[k+2],S34,0xC4AC5665);
      a=II(a,b,c,d,blocks[k+0],S41,0xF4292244);d=II(d,a,b,c,blocks[k+7],S42,0x432AFF97);c=II(c,d,a,b,blocks[k+14],S43,0xAB9423A7);b=II(b,c,d,a,blocks[k+5],S44,0xFC93A039);
      a=II(a,b,c,d,blocks[k+12],S41,0x655B59C3);d=II(d,a,b,c,blocks[k+3],S42,0x8F0CCC92);c=II(c,d,a,b,blocks[k+10],S43,0xFFEFF47D);b=II(b,c,d,a,blocks[k+1],S44,0x85845DD1);
      a=II(a,b,c,d,blocks[k+8],S41,0x6FA87E4F);d=II(d,a,b,c,blocks[k+15],S42,0xFE2CE6E0);c=II(c,d,a,b,blocks[k+6],S43,0xA3014314);b=II(b,c,d,a,blocks[k+13],S44,0x4E0811A1);
      a=II(a,b,c,d,blocks[k+4],S41,0xF7537E82);d=II(d,a,b,c,blocks[k+11],S42,0xBD3AF235);c=II(c,d,a,b,blocks[k+2],S43,0x2AD7D2BB);b=II(b,c,d,a,blocks[k+9],S44,0xEB86D391);
      a=addUnsigned(a,AA);b=addUnsigned(b,BB);c=addUnsigned(c,CC);d=addUnsigned(d,DD);
    }
    const out = new Uint8Array(16);
    [a,b,c,d].forEach((v,i)=>{for(let j=0;j<4;j++)out[i*4+j]=(v>>(j*8))&0xff;});
    return out;
  }

  const evpKDF = async (passwordStr, salt, keyLen, ivLen) => {
    const password = new TextEncoder().encode(passwordStr);
    const result = new Uint8Array(keyLen + ivLen);
    let prev = new Uint8Array(0);
    let filled = 0;
    while (filled < keyLen + ivLen) {
      const combined = new Uint8Array(prev.length + password.length + salt.length);
      combined.set(prev);
      combined.set(password, prev.length);
      combined.set(salt, prev.length + password.length);
      prev = md5(combined);
      result.set(prev.slice(0, Math.min(prev.length, keyLen + ivLen - filled)), filled);
      filled += prev.length;
    }
    return { key: result.slice(0, keyLen), iv: result.slice(keyLen, keyLen + ivLen) };
  };

  const decryptAES = async (b64, passphrase) => {
    const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const salt = binary.slice(8, 16);
    const ciphertext = binary.slice(16);
    const { key, iv } = await evpKDF(passphrase, salt, 32, 16);
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    return new TextDecoder().decode(plain);
  };

  const encryptAES = async (plaintext, passphrase) => {
    const salt = crypto.getRandomValues(new Uint8Array(8));
    const { key, iv } = await evpKDF(passphrase, salt, 32, 16);
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt']);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, new TextEncoder().encode(plaintext)));
    const salted = new Uint8Array(16 + ct.length);
    salted.set(new TextEncoder().encode('Salted__'), 0);
    salted.set(salt, 8);
    salted.set(ct, 16);
    let binary = '';
    for (let i = 0; i < salted.length; i++) binary += String.fromCharCode(salted[i]);
    return btoa(binary);
  };

  /*
   * Tier -> Species 映射
   * 蛋显示的稀有度基于 egg.species 的本体 tier (游戏会忽略 egg.tier 字段).
   * 所以给蛋设 species 时必须选对应 tier 的宝可梦.
   * 以下为每个 tier 的常见物种精选池, 覆盖主流代表性宝可梦.
   * 如需孵出池子外的宝可梦, 用 PRG.giveEggs(..., species=X) 指定具体 species id.
   */
  const TIER_SPECIES = {
    // Common - 大量低级/常见宝可梦
    0: [
      10, 13, 16, 19, 21, 23, 27, 29, 32, 41, 43, 46, 48, 50, 52, 54, 56, 58, 60, 66,
      69, 72, 74, 77, 81, 84, 86, 88, 90, 92, 98, 100, 102, 104, 109, 116, 118, 120,
      129, 138, 140, 161, 163, 165, 167, 170, 177, 183, 187, 191, 194, 198, 203, 206,
      209, 218, 220, 223, 225, 228, 231, 263, 265, 273, 276, 278, 283, 285, 296, 299,
      300, 311, 313, 315, 316, 318, 320, 328, 331, 333, 339, 341, 345, 347, 353, 363,
      369, 371, 396, 399, 401, 403, 418, 420, 422, 427, 431, 434, 436, 441, 449, 453,
      456, 504, 506, 509, 511, 513, 515, 517, 519, 522, 524, 527, 529, 532, 535, 539,
      543, 546, 548, 550, 552, 554, 556, 558, 562, 564, 568, 570, 572, 580, 587, 594,
      597, 599, 602, 605, 616, 618, 619, 621, 626, 631, 659, 661, 667, 669, 676, 677,
      679, 682, 684, 686, 688, 692, 702, 705, 707, 710, 731, 734, 736, 742, 744, 747,
      749, 751, 753, 755, 757, 759, 761, 769, 771, 775, 777, 779, 782, 810, 813, 816,
      819, 821, 824, 827, 829, 831, 835, 837, 840, 846, 848, 850, 852, 854, 856, 859,
    ],
    // Rare - 御三家 + 皮卡丘 + 伊布 + 准传说基础型
    1: [
      1, 4, 7, 25, 133, 143, 152, 155, 158, 215, 220, 246, 252, 255, 258, 280, 290,
      298, 304, 306, 328, 349, 361, 363, 371, 387, 390, 393, 406, 410, 425, 439, 440,
      442, 443, 446, 447, 495, 498, 501, 540, 543, 554, 570, 599, 605, 607, 613, 619,
      621, 633, 650, 653, 656, 659, 677, 696, 698, 704, 708, 712, 714, 722, 725, 728,
      782, 810, 813, 816, 856, 859, 877, 883, 885, 908, 909, 910, 915, 918, 923, 926,
    ],
    // Epic - 伪传说和高星
    2: [
      149, 212, 227, 229, 230, 232, 248, 254, 257, 260, 282, 303, 308, 310, 319, 323,
      330, 334, 350, 362, 373, 376, 389, 392, 395, 407, 409, 411, 423, 426, 432, 437,
      438, 445, 450, 452, 454, 457, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473,
      474, 475, 476, 530, 531, 534, 553, 563, 567, 571, 589, 596, 609, 612, 615, 625,
      630, 635, 637, 663, 668, 673, 675, 681, 687, 689, 691, 694, 695, 697, 700, 701,
      706, 711, 713, 715, 724, 727, 730, 733, 735, 737, 738, 745, 750, 752, 754, 756,
      758, 760, 762, 763, 764, 765, 766, 767, 768, 770, 773, 776, 780, 781, 784, 787,
    ],
    // Legendary - 所有传说和幻之宝可梦 (含 Gen 1-9)
    3: [
      144, 145, 146, 150, 151,
      243, 244, 245, 249, 250, 251,
      377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
      480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
      494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
      716, 717, 718, 719, 720, 721,
      772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796,
      797, 798, 799, 800, 801, 802, 807, 808, 809,
      888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905,
      1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024,
    ],
  };
  const pickSpecies = (tier) => {
    const arr = TIER_SPECIES[tier] || TIER_SPECIES[0];
    return arr[Math.floor(Math.random() * arr.length)];
  };

  /* ===== API ===== */
  const getCSID = () => {
    if (!window.__PRGCapturedCSID) throw new Error(
      '未捕获 CSID. 请在游戏里点"加载游戏"触发请求, 或手动 PRG.setCSID("...")'
    );
    return window.__PRGCapturedCSID;
  };

  const api = async (method, path, body) => {
    const csid = getCSID();
    const opts = { method, headers: { Authorization: SID } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const sep = path.includes('?') ? '&' : '?';
    const r = await rawFetch(`${API}${path}${sep}clientSessionId=${encodeURIComponent(csid)}`, opts);
    const text = await r.text();
    if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${text.substring(0,150)}`);
    try { return text ? JSON.parse(text) : null; } catch { return text; }
  };

  /* ===== 双写：server + localStorage ===== */
  const saveSystem = async (sys) => {
    sys.timestamp = Date.now() + 3600000;
    const encrypted = await encryptAES(JSON.stringify(sys), SECRET);
    localStorage.setItem(LOCAL_KEY, encrypted);
    await api('POST', '/savedata/system/update', sys);
  };

  const loadSystem = async () => await api('GET', '/savedata/system/get');

  const loadSystemLocal = async () => {
    const enc = localStorage.getItem(LOCAL_KEY);
    if (!enc) return null;
    return JSON.parse(await decryptAES(enc, SECRET));
  };

  const PRG = {
    SID, api, USERNAME, LOCAL_KEY, TIER_SPECIES,
    get activeCSID() { return window.__PRGCapturedCSID; },

    setCSID(csid) { window.__PRGCapturedCSID = csid.trim(); console.log('[PRG] CSID 已设置'); },

    async waitCSID(ms = 15000) {
      const start = Date.now();
      while (!window.__PRGCapturedCSID && Date.now() - start < ms) await new Promise(r => setTimeout(r, 200));
      if (!window.__PRGCapturedCSID) throw new Error('等待 CSID 超时');
      return window.__PRGCapturedCSID;
    },

    status() {
      console.log(`PRG v1.12.0.11
  user:   ${USERNAME}
  csid:   ${window.__PRGCapturedCSID || '(未捕获)'}
  lsKey:  ${LOCAL_KEY}`);
    },

    async verify() {
      const server = await loadSystem();
      const local = await loadSystemLocal();
      const stats = (arr) => arr.reduce((a,e)=>{a['tier'+e.tier]=(a['tier'+e.tier]||0)+1;return a;}, {});
      const info = {
        server: { eggs: server.eggs.length, tiers: stats(server.eggs), timestamp: server.timestamp },
        local: local ? { eggs: local.eggs.length, tiers: stats(local.eggs), timestamp: local.timestamp } : null,
      };
      console.log(JSON.stringify(info, null, 2));
      return info;
    },

    async hatchAll(waves = 1) {
      const sys = await loadSystem();
      if (sys.eggs.length === 0) { console.warn('[PRG] 服务器端没有蛋, 先 PRG.giveEggs()'); return; }
      sys.eggs.forEach(e => { e.hatchWaves = waves; });
      await saveSystem(sys);
      console.log(`[PRG] ${sys.eggs.length} 蛋 hatchWaves=${waves}. F5 刷新游戏生效`);
    },

    /*
     * 改所有现有蛋的 tier
     * tier 参数: 0 普通 / 1 稀有 / 2 史诗 / 3 传说
     * species 参数: 可选. 不传 = 从预设池随机; 传数字 = 全部指定为这只; 传数组 = 从数组里随机
     *   例: PRG.setEggTier(3, 150)              所有蛋变成超梦
     *       PRG.setEggTier(3, [150, 151, 249])  所有蛋从这三只里随机
     */
    async setEggTier(tier = 3, species) {
      const sys = await loadSystem();
      if (sys.eggs.length === 0) { console.warn('[PRG] 没有蛋'); return; }
      const pick = () => {
        if (species === undefined) return pickSpecies(tier);
        if (Array.isArray(species)) return species[Math.floor(Math.random() * species.length)];
        return species;
      };
      sys.eggs.forEach(e => { e.tier = tier; e.species = pick(); });
      await saveSystem(sys);
      console.log(`[PRG] ${sys.eggs.length} 蛋 tier=${tier}${species !== undefined ? ', species=' + JSON.stringify(species) : ''}. F5 生效`);
    },

    async makeAllShiny(onlyNormal = false) {
      const sys = await loadSystem();
      let count = 0;
      sys.eggs.forEach(e => { if (!onlyNormal || e.tier === 0) { e.isShiny = true; count++; } });
      await saveSystem(sys);
      console.log(`[PRG] ${count} 蛋改闪光. F5 生效`);
    },

    /*
     * 送 N 个蛋
     * species 参数: 可选. 不传 = 从该 tier 预设池随机; 传数字 = 都是这只; 传数组 = 数组里随机
     *   例: PRG.giveEggs(10, 3)              10 个传说蛋, 从预设池随机
     *       PRG.giveEggs(10, 3, 1, 150)      10 个蛋全是超梦
     *       PRG.giveEggs(10, 3, 1, [150, 151, 249, 250])  从这四只里随机
     */
    async giveEggs(count = 10, tier = 3, waves = 1, species) {
      const sys = await loadSystem();
      const now = Date.now();
      const pick = () => {
        if (species === undefined) return pickSpecies(tier);
        if (Array.isArray(species)) return species[Math.floor(Math.random() * species.length)];
        return species;
      };
      for (let i = 0; i < count; i++) {
        sys.eggs.push({
          id: Math.floor(Math.random() * 2 ** 31),
          gachaType: 0, hatchWaves: waves, timestamp: now + i,
          tier, sourceType: 0, variantTier: 0, isShiny: false,
          species: pick(),
          eggMoveIndex: Math.floor(Math.random() * 4),
          overrideHiddenAbility: false
        });
      }
      await saveSystem(sys);
      console.log(`[PRG] 加 ${count} 个 tier=${tier} 蛋${species !== undefined ? ' (species=' + JSON.stringify(species) + ')' : ''}. F5 生效`);
    },

    /* 显示某 tier 的预设池 (让你看能孵出哪些宝可梦) */
    showEggPool(tier) {
      if (tier === undefined) {
        console.log('[PRG] 用法: PRG.showEggPool(tier)  tier=0/1/2/3');
        [0,1,2,3].forEach(t => console.log(`  tier ${t} 池子大小: ${TIER_SPECIES[t].length}`));
        return;
      }
      console.log(`[PRG] tier ${tier} 预设池 (${TIER_SPECIES[tier].length} 种):`);
      console.log(TIER_SPECIES[tier].join(', '));
    },

    async giveVouchers(amount = 99) {
      const sys = await loadSystem();
      sys.voucherCounts = sys.voucherCounts || {};
      for (let i = 0; i < 4; i++) sys.voucherCounts[i] = amount;
      await saveSystem(sys);
      console.log(`[PRG] 四种券各 ${amount} 张. F5 生效`);
    },

    async unlockAllDex() {
      const sys = await loadSystem();
      let count = 0;
      Object.keys(sys.dexData).forEach(species => {
        const d = sys.dexData[species];
        d.caughtAttr = Number(BigInt(d.caughtAttr || 0) | 15n);
        d.seenAttr = Number(BigInt(d.seenAttr || 0) | 15n);
        d.natureAttr = Math.pow(2, 25) - 1;
        d.seenCount = Math.max(d.seenCount || 0, 1);
        d.caughtCount = Math.max(d.caughtCount || 0, 1);
        d.ivs = [31,31,31,31,31,31];
        count++;
      });
      await saveSystem(sys);
      console.log(`[PRG] 图鉴 ${count} 全开. F5 生效`);
    },

    async unlockAllStarters() {
      const sys = await loadSystem();
      Object.keys(sys.starterData).forEach(species => {
        const s = sys.starterData[species];
        s.eggMoves = 15;
        s.candyCount = Math.max(s.candyCount || 0, 999);
        s.friendship = 255;
        s.abilityAttr = 7;
        s.passiveAttr = 3;
        s.valueReduction = 10;
        s.classicWinCount = Math.max(s.classicWinCount || 0, 1);
      });
      await saveSystem(sys);
      console.log('[PRG] starter 全解锁. F5 生效');
    },

    async unlockAllAchievements() {
      const sys = await loadSystem();
      const now = Date.now();
      Object.keys(sys.achvUnlocks).forEach(a => { if (!sys.achvUnlocks[a]) sys.achvUnlocks[a] = now; });
      Object.keys(sys.voucherUnlocks).forEach(v => { if (!sys.voucherUnlocks[v]) sys.voucherUnlocks[v] = now; });
      await saveSystem(sys);
      console.log('[PRG] 成就全解锁. F5 生效');
    },

    /*
     * Session (slot) 相关 - 战斗中实时精调
     * 改完必须 F5. F5 后游戏回到当前 wave 开头, 队伍/道具是新数据
     */

    async currentSlot() {
      const info = await api('GET', '/account/info');
      return info.lastSessionSlot ?? 0;
    },

    async getSession(slot) {
      if (slot === undefined) slot = await this.currentSlot();
      try { return await api('GET', `/savedata/session/get?slot=${slot}`); }
      catch (e) { if (e.message.includes('404')) return null; throw e; }
    },

    async showParty(slot) {
      if (slot === undefined) slot = await this.currentSlot();
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const info = d.party.map((p, i) => ({
        idx: i, id: p.id, species: p.species,
        lv: p.level, hp: `${p.hp}/${p.stats[0]}`, nature: p.nature,
        status: p.status?.effect ?? null,
      }));
      console.table(info);
      return info;
    },

    async showItems(slot) {
      if (slot === undefined) slot = await this.currentSlot();
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const partyIds = new Map(d.party.map((p, i) => [p.id, i]));
      const info = d.modifiers.map(m => ({
        typeId: m.typeId, stack: m.stackCount,
        belongsTo: partyIds.has(m.args?.[0]) ? `party[${partyIds.get(m.args[0])}]` : 'global',
      }));
      console.table(info);
      return info;
    },

    async heal(slot) {
      if (slot === undefined) slot = await this.currentSlot();
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      d.party.forEach(p => { p.hp = p.stats[0]; p.status = null; });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} 全队 HP 回满. F5 生效`);
    },

    async setHP(slot, idx, hp) {
      if (arguments.length < 3) { console.error('用法: PRG.setHP(slot, idx, hp)'); return; }
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      if (!d.party[idx]) { console.error(`party[${idx}] 不存在`); return; }
      d.party[idx].hp = hp;
      d.party[idx].status = null;
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} party[${idx}] HP=${hp}. F5 生效`);
    },

    async setLevel(slot, idx, level) {
      if (arguments.length < 3) { console.error('用法: PRG.setLevel(slot, idx, lv)'); return; }
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      if (!d.party[idx]) { console.error(`party[${idx}] 不存在`); return; }
      d.party[idx].level = level;
      d.party[idx].exp = 8000000;
      d.party[idx].hp = d.party[idx].stats[0];
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} party[${idx}] Lv=${level}. F5 生效`);
    },

    async buffParty(slot = 0, ivs = [31,31,31,31,31,31]) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      d.party.forEach(p => { p.ivs = [...ivs]; p.friendship = 255; p.hp = p.stats[0]; p.pokerus = true; p.status = null; });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} IV=${ivs}. F5 生效`);
    },

    async giveItem(slot, pokemonIdx, typeId, stackCount = 1) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const p = d.party[pokemonIdx];
      if (!p) { console.error(`party[${pokemonIdx}] 不存在`); return; }
      const classMap = {
        LEFTOVERS: 'TurnHealModifier', SHELL_BELL: 'HitHealModifier',
        SOUL_DEW: 'PokemonNatureWeightModifier', LIFE_ORB: 'PokemonAttackBoosterModifier',
        FOCUS_BAND: 'SurviveDamageModifier', REVIVER_SEED: 'PokemonInstantReviveModifier',
        SCOPE_LENS: 'CritBoosterModifier', WIDE_LENS: 'PokemonMoveAccuracyBoosterModifier',
        KINGS_ROCK: 'FlinchChanceModifier', MULTI_LENS: 'PokemonMultiHitModifier',
        GRIP_CLAW: 'ContactHeldItemTransferChanceModifier', QUICK_CLAW: 'PreserveBerryModifier',
        GOLDEN_PUNCH: 'DamageMoneyRewardModifier',
      };
      d.modifiers = d.modifiers.filter(m => !(m.typeId === typeId && m.args?.[0] === p.id));
      d.modifiers.push({
        args: typeId === 'SCOPE_LENS' || typeId === 'WIDE_LENS' ? [p.id, 1] : [p.id],
        className: classMap[typeId] || 'PokemonHeldItemModifier',
        player: true, stackCount, typeId,
      });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} party[${pokemonIdx}] +${stackCount}x ${typeId}. F5 生效`);
    },

    // stat: 0=HP 1=Atk 2=Def 3=SpAtk 4=SpDef 5=Spd
    async giveVitamin(slot, pokemonIdx, stat, stackCount = 10) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const p = d.party[pokemonIdx];
      if (!p) { console.error(`party[${pokemonIdx}] 不存在`); return; }
      d.modifiers = d.modifiers.filter(m => !(m.typeId === 'BASE_STAT_BOOSTER' && m.args?.[0] === p.id && m.args?.[1] === stat));
      d.modifiers.push({ args: [p.id, stat], className: 'BaseStatModifier', player: true, stackCount, typeId: 'BASE_STAT_BOOSTER' });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      const names = ['HP','Atk','Def','SpAtk','SpDef','Spd'];
      console.log(`[PRG] slot ${slot} party[${pokemonIdx}] +${stackCount}x ${names[stat]} vitamin. F5 生效`);
    },

    async giveGlobalItem(slot, typeId, stackCount = 1) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const globalMap = {
        EXP_SHARE: 'ExpShareModifier', EXP_CHARM: ['ExpBoosterModifier', [25]],
        SUPER_EXP_CHARM: ['ExpBoosterModifier', [60]], AMULET_COIN: 'MoneyMultiplierModifier',
        GOLDEN_POKEBALL: 'ExtraModifierModifier', LUCKY_EGG: 'ExpBoosterModifier',
        CANDY_JAR: 'LevelIncrementBoosterModifier', ABILITY_CHARM: 'HiddenAbilityRateBoosterModifier',
        MAP: 'MapModifier', IV_SCANNER: 'IvScannerModifier', LOCK_CAPSULE: 'LockModifierTiersModifier',
        TERA_ORB: 'TerastallizeAccessModifier', MEGA_BRACELET: 'MegaEvolutionAccessModifier',
        DYNAMAX_BAND: 'GigantamaxAccessModifier', SOOTHE_BELL: 'PokemonFriendshipBoosterModifier',
      };
      const info = globalMap[typeId];
      const className = Array.isArray(info) ? info[0] : (info || 'ModifierType');
      const args = Array.isArray(info) ? info[1] : [];
      d.modifiers = d.modifiers.filter(m => m.typeId !== typeId);
      d.modifiers.push({ args, className, player: true, stackCount, typeId });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} +${stackCount}x ${typeId} (global). F5 生效`);
    },

    async giveBalls(slot, amount = 50) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      if (d.pokeballCounts) Object.keys(d.pokeballCounts).forEach(k => { d.pokeballCounts[k] = amount; });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} 各种精灵球 ${amount} 个. F5 生效`);
    },

    async giveFullItems(slot = 0) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      const partyIds = new Set(d.party.map(p => p.id));
      const perPokemon = new Set(['BASE_STAT_BOOSTER','SOUL_DEW','LEFTOVERS','SHELL_BELL','WIDE_LENS','SCOPE_LENS','FOCUS_BAND','KINGS_ROCK','GOLDEN_PUNCH','LIFE_ORB','MULTI_LENS','REVIVER_SEED']);
      d.modifiers = d.modifiers.filter(m => !m.args?.length || !perPokemon.has(m.typeId) || typeof m.args[0] !== 'number' || !partyIds.has(m.args[0]));
      const add = (t, c, a, s) => d.modifiers.push({ args: a, className: c, player: true, stackCount: s, typeId: t });
      d.party.forEach(p => {
        for (let i = 0; i < 6; i++) add('BASE_STAT_BOOSTER','BaseStatModifier',[p.id,i],10);
        add('SOUL_DEW','PokemonNatureWeightModifier',[p.id],10);
        add('LEFTOVERS','TurnHealModifier',[p.id],4);
        add('SHELL_BELL','HitHealModifier',[p.id],4);
        add('REVIVER_SEED','PokemonInstantReviveModifier',[p.id],1);
        add('FOCUS_BAND','SurviveDamageModifier',[p.id],3);
      });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} 道具满配. F5 生效`);
    },

    async weakenBoss(slot = 0, hp = 1) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      if (!d.enemyParty?.length) { console.warn('[PRG] 没有敌方 (可能不在战斗中)'); return; }
      d.enemyParty.forEach(e => { e.hp = hp; e.bossSegments = 1; });
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} 敌方 HP=${hp}. F5 生效`);
    },

    async setMoney(slot = 0, amount = 999999) {
      const d = await api('GET', `/savedata/session/get?slot=${slot}`);
      d.money = amount;
      await api('POST', `/savedata/session/update?slot=${slot}`, d);
      console.log(`[PRG] slot ${slot} money=${amount}`);
    },

    async backupSystemLocal() {
      const sys = await loadSystem();
      const blob = new Blob([JSON.stringify(sys, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pokerogue_system_${Date.now()}.json`;
      a.click();
      console.log('[PRG] system backup 已下载');
    },

    help() {
      console.log([
        'PRG v1.12.0.11  命令清单',
        '',
        '[eggs]',
        '  PRG.hatchAll(waves=1)                     所有蛋 N 波后孵化',
        '  PRG.setEggTier(tier=3, species?)          改稀有度 (0 普通 1 稀有 2 史诗 3 传说)',
        '  PRG.makeAllShiny()                        全部改闪光',
        '  PRG.giveEggs(count=10, tier=3, waves=1, species?)',
        '  PRG.showEggPool(tier)                     查看某 tier 预设物种池',
        '  species 可选:  不传 = 预设池随机  数字 = 全是这只  数组 = 数组里随机',
        '    例: PRG.giveEggs(10, 3, 1, 150)         10 个超梦蛋',
        '    例: PRG.giveEggs(10, 3, 1, [150, 249])  10 个蛋从超梦/洛奇亚里随机',
        '',
        '[account]',
        '  PRG.giveVouchers(amount=99)  四种券各 N 张',
        '  PRG.unlockAllDex()           图鉴全开',
        '  PRG.unlockAllStarters()      starter 全解锁',
        '  PRG.unlockAllAchievements()  成就全解锁',
        '',
        '[session - 省略 slot 则用当前 slot]',
        '  PRG.showParty()              显示队伍',
        '  PRG.showItems()              显示道具列表',
        '  PRG.heal()                   全队回满 HP',
        '  PRG.setHP(slot, idx, hp)',
        '  PRG.setLevel(slot, idx, lv)',
        '  PRG.buffParty(slot, ivs=[31,31,31,31,31,31])',
        '  PRG.weakenBoss(slot, hp=1)',
        '  PRG.setMoney(slot, amount=999999)',
        '  PRG.giveBalls(slot, amount=50)',
        '',
        '[session items - 单只宝可梦]',
        '  PRG.giveItem(slot, idx, typeId, stack=1)',
        '    typeId: LEFTOVERS / SHELL_BELL / SOUL_DEW / LIFE_ORB',
        '            FOCUS_BAND / REVIVER_SEED / SCOPE_LENS / WIDE_LENS',
        '            KINGS_ROCK / MULTI_LENS / GRIP_CLAW / QUICK_CLAW',
        '  PRG.giveVitamin(slot, idx, stat, stack=10)',
        '    stat: 0=HP 1=Atk 2=Def 3=SpAtk 4=SpDef 5=Spd',
        '  PRG.giveFullItems(slot)      一键堆满全队',
        '',
        '[session items - 全局]',
        '  PRG.giveGlobalItem(slot, typeId, stack=1)',
        '    typeId: EXP_SHARE / EXP_CHARM / SUPER_EXP_CHARM / AMULET_COIN',
        '            GOLDEN_POKEBALL / LUCKY_EGG / CANDY_JAR / ABILITY_CHARM',
        '            MAP / IV_SCANNER / LOCK_CAPSULE / TERA_ORB',
        '            MEGA_BRACELET / DYNAMAX_BAND / SOOTHE_BELL',
        '',
        '[tools]',
        '  PRG.status()                 看 CSID / 用户状态',
        '  PRG.verify()                 对比 server vs local',
        '  PRG.setCSID("xxx")           手动设 CSID',
        '  PRG.currentSlot()            当前 slot 编号',
        '  PRG.backupSystemLocal()      下载 system 备份',
        '',
        '流程: 粘脚本 -> 游戏点菜单 -> PRG.XXX() -> F5',
      ].join('\n'));
    }
  };

  window.PRG = PRG;
  console.log(`[PRG] v1.12.0.11 ready  (user: ${USERNAME})`);
  if (window.__PRGCapturedCSID) console.log('[PRG] CSID 已就绪, 可以使用命令');
  else console.log('[PRG] 还未捕获 CSID, 在游戏里点一下"加载游戏"触发请求');
  console.log('[PRG] 查看命令: PRG.help()');
})();
