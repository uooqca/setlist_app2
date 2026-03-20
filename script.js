let members = [];
let songs = [];

// ----------------
// 手動追加
// ----------------
function addMember() {
  const val = document.getElementById("memberInput").value.trim();
  if (!val || members.includes(val)) return;
  members.push(val);
  renderMembers();
}

function addSong() {
  const val = document.getElementById("songInput").value.trim();
  if (!val) return;
  songs.push({ name: val, members: [], fixed: null });
  renderSongs();
}

// ----------------
// 表示
// ----------------
function renderMembers() {
  const list = document.getElementById("memberList");
  list.innerHTML = "";
  members.forEach(m => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = m;
    list.appendChild(div);
  });
}

function renderSongs() {
  const list = document.getElementById("songList");
  list.innerHTML = "";

  songs.forEach((song, i) => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <b>${song.name}</b><br>
      ${song.members.join(", ")}<br>
      <button onclick="selectMembers(${i})">メンバー選択</button>
      <button onclick="setFixed(${i})">位置固定</button>
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
  const pos = prompt("何曲目に固定？（例：1）");
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
// パース（ポスター対応）
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
}

// ----------------
// セトリ生成（🔥本命）
// ----------------
function generateSetlist() {
  let result = [];
  let remaining = [...songs];

  // 固定配置
  remaining.forEach(song => {
    if (song.fixed !== null) {
      result[song.fixed] = song;
    }
  });

  remaining = remaining.filter(s => s.fixed === null);

  let memberLast = {};

  for (let i = 0; i < songs.length; i++) {

    if (result[i]) continue;

    let placed = false;

    for (let j = 0; j < remaining.length; j++) {
      const song = remaining[j];

      let ok = true;

      song.members.forEach(m => {
        if (memberLast[m] !== undefined) {
          if (i - memberLast[m] < 4) ok = false;
        }
      });

      if (ok) {
        result[i] = song;
        song.members.forEach(m => memberLast[m] = i);
        remaining.splice(j, 1);
        placed = true;
        break;
      }
    }

    // ダメなら3曲に緩和
    if (!placed) {
      for (let j = 0; j < remaining.length; j++) {
        const song = remaining[j];

        let ok = true;
        song.members.forEach(m => {
          if (memberLast[m] !== undefined) {
            if (i - memberLast[m] < 3) ok = false;
          }
        });

        if (ok) {
          result[i] = song;
          song.members.forEach(m => memberLast[m] = i);
          remaining.splice(j, 1);
          break;
        }
      }
    }
  }

  // 表示（曲順のみ）
  document.getElementById("result").innerHTML =
    result.map((s, i) => `${i + 1}. ${s ? s.name : "未配置"}`).join("<br>");
}