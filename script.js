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
  songs.push({ name: val, members: [] });
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

  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = song.name + "（" + song.members.join(", ") + "）";
    list.appendChild(div);
  });
}

// ----------------
// OCR読み込み
// ----------------
document.getElementById("loadImageBtn").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("画像選んでね🥺");
    return;
  }

  const result = await Tesseract.recognize(file, "jpn+eng", {
    tessedit_pageseg_mode: 6
  });

  const text = result.data.text;
  console.log(text);

  const parsed = parseText(text);
  addDataFromOCR(parsed);
});

// ----------------
// ★ポスター対応パーサ
// ----------------
function parseText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);

  const data = [];
  let currentSong = null;

  lines.forEach(line => {

    // 曲判定（/ or 英字スタート）
    if (line.includes("/") || /^[a-zA-Z]/.test(line)) {

      // (6)とか削除
      const clean = line.replace(/\(.*?\)/g, "").trim();

      currentSong = {
        song: clean,
        members: []
      };
      data.push(currentSong);

    } else if (currentSong) {
      // 名前っぽいもの追加
      if (line.length <= 10) {
        currentSong.members.push(line);
      }
    }
  });

  return data;
}

// ----------------
// OCR結果を反映
// ----------------
function addDataFromOCR(parsedData) {
  parsedData.forEach(item => {

    let song = songs.find(s => s.name === item.song);

    if (!song) {
      song = { name: item.song, members: [] };
      songs.push(song);
    }

    item.members.forEach(m => {
      if (!members.includes(m)) {
        members.push(m);
      }
      if (!song.members.includes(m)) {
        song.members.push(m);
      }
    });

  });

  renderMembers();
  renderSongs();

  alert("画像から追加できたよ✨");
}