let members = [];
let songs = [];

// ----------------
// メンバー追加
// ----------------
function addMember() {
  const val = document.getElementById("memberInput").value.trim();
  if (!val || members.includes(val)) return;
  members.push(val);
  renderMembers();
}

// ----------------
// 曲追加
// ----------------
function addSong() {
  const val = document.getElementById("songInput").value.trim();
  if (!val) return;
  songs.push({ name: val, members: [], fixed: null });
  renderSongs();
}

// ----------------
// メンバー表示（編集＆削除付き）
// ----------------
function renderMembers() {
  const list = document.getElementById("memberList");
  list.innerHTML = "";

  members.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      ${m}
      <button class="small-btn" onclick="editMember(${index})">✏️</button>
      <button class="small-btn" onclick="deleteMember(${index})">×</button>
    `;

    list.appendChild(div);
  });
}

// ----------------
// メンバー編集
// ----------------
function editMember(index) {
  const oldName = members[index];
  const newName = prompt("名前を修正", oldName);

  if (!newName || newName === oldName) return;

  members[index] = newName;

  // 曲側も更新
  songs.forEach(song => {
    song.members = song.members.map(m =>
      m === oldName ? newName : m
    );
  });

  renderMembers();
  renderSongs();
}

// ----------------
// メンバー削除
// ----------------
function deleteMember(index) {
  const name = members[index];

  members.splice(index, 1);

  // 曲からも削除
  songs.forEach(song => {
    song.members = song.members.filter(m => m !== name);
  });

  renderMembers();
  renderSongs();
}

// ----------------
// 曲表示
// ----------------
function renderSongs() {
  const list = document.getElementById("songList");
  list.innerHTML = "";

  songs.forEach((song, i) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${song.name}</b><br>
      ${song.members.join(", ")}<br>
      <button class="small-btn" onclick="selectMembers(${i})">メンバー</button>
      <button class="small-btn" onclick="setFixed(${i})">固定</button>
    `;

    list.appendChild(div);
  });
}

// ----------------
// メンバー選択
// ----------------
function selectMembers(index) {
  const selected = prompt("カンマ区切りで入力\n" + members.join(","));
  if (!selected) return;

  songs[index].members = selected.split(",").map(s => s.trim());
  renderSongs();
}

// ----------------
// 位置固定
// ----------------
function setFixed(index) {
  const pos = prompt("何曲目に固定？");
  if (!pos) return;

  songs[index].fixed = parseInt(pos) - 1;
}

// ----------------
// OCR読み込み
// ----------------
document.getElementById("loadImageBtn").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) return alert("画像選んでね🥺");

  const result = await Tesseract.recognize(file, "jpn+eng", {
    tessedit_pageseg_mode: 6
  });

  const parsed = parseText(result.data.text);
  addDataFromOCR(parsed);
});

// ----------------
// ポスター用パース
// ----------------
function parseText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);

  const data = [];
  let currentSong = null;

  lines.forEach(line => {
    if (line.includes("/") || /^[a-zA-Z]/.test(line)) {
      const clean = line.replace(/\(.*?\)/g, "").trim();
      currentSong = { song: clean, members: [] };
      data.push(currentSong);
    } else if (currentSong && line.length <= 10) {
      currentSong.members.push(line);
    }
  });

  return data;
}

// ----------------
// OCR反映
// ----------------
function addDataFromOCR(parsedData) {
  parsedData.forEach(item => {
    let song = songs.find(s => s.name === item.song);

    if (!song) {
      song = { name: item.song, members: [], fixed: null };
      songs.push(song);
    }

    item.members.forEach(m => {
      if (!members.includes(m)) members.push(m);
      if (!song.members.includes(m)) song.members.push(m);
    });
  });

  renderMembers();
  renderSongs();

  alert("追加できたよ✨");
}

// ----------------
// セトリ生成
// ----------------
function generateSetlist() {
  let result = [];
  let remaining = [...songs];
  let memberLast = {};

  // 固定
  remaining.forEach(song => {
    if (song.fixed !== null) {
      result[song.fixed] = song;
    }
  });

  remaining = remaining.filter(s => s.fixed === null);

  for (let i = 0; i < songs.length; i++) {

    if (result[i]) continue;

    let placed = false;

    // 4曲ルール
    for (let j = 0; j < remaining.length; j++) {
      const song = remaining[j];

      let ok = song.members.every(m =>
        memberLast[m] === undefined || i - memberLast[m] >= 4
      );

      if (ok) {
        result[i] = song;
        song.members.forEach(m => memberLast[m] = i);
        remaining.splice(j, 1);
        placed = true;
        break;
      }
    }

    // 3曲に緩和
    if (!placed) {
      for (let j = 0; j < remaining.length; j++) {
        const song = remaining[j];

        let ok = song.members.every(m =>
          memberLast[m] === undefined || i - memberLast[m] >= 3
        );

        if (ok) {
          result[i] = song;
          song.members.forEach(m => memberLast[m] = i);
          remaining.splice(j, 1);
          break;
        }
      }
    }
  }

  document.getElementById("result").innerHTML =
    result.map((s, i) => `${i + 1}. ${s ? s.name : "未配置"}`).join("<br>");
}