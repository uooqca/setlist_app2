let members = [];
let songs = [];
let assignments = {};

// ===== メンバー =====
function addMember() {
  const input = document.getElementById("memberInput");
  const name = input.value.trim();
  if (!name) return;

  members.push(name);
  input.value = "";
  renderMembers();
  renderSongs();
}

function removeMember(name) {
  members = members.filter(m => m !== name);
  for (let song in assignments) {
    assignments[song] = assignments[song].filter(m => m !== name);
  }
  renderMembers();
  renderSongs();
}

function renderMembers() {
  const list = document.getElementById("memberList");
  list.innerHTML = "";

  members.forEach(name => {
    const div = document.createElement("div");
    div.className = "member-item";
    div.textContent = name;

    const del = document.createElement("button");
    del.textContent = "×";
    del.onclick = () => removeMember(name);

    div.appendChild(del);
    list.appendChild(div);
  });
}

// ===== 曲 =====
function addSong() {
  const input = document.getElementById("songInput");
  const name = input.value.trim();
  if (!name) return;

  songs.push(name);
  assignments[name] = [];

  input.value = "";
  renderSongs();
}

function removeSong(name) {
  songs = songs.filter(s => s !== name);
  delete assignments[name];
  renderSongs();
}

function renderSongs() {
  const list = document.getElementById("songList");
  list.innerHTML = "";

  songs.forEach(song => {
    const box = document.createElement("div");

    const title = document.createElement("div");
    title.textContent = song;
    title.style.cursor = "pointer";

    const content = document.createElement("div");
    content.style.display = "none";

    title.onclick = () => {
      content.style.display =
        content.style.display === "none" ? "block" : "none";
    };

    members.forEach(m => {
      const label = document.createElement("label");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = assignments[song].includes(m);

      checkbox.onchange = () => {
        if (checkbox.checked) {
          assignments[song].push(m);
        } else {
          assignments[song] =
            assignments[song].filter(x => x !== m);
        }
      };

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(m));
      content.appendChild(label);
    });

    const del = document.createElement("button");
    del.textContent = "×";
    del.onclick = () => removeSong(song);

    box.appendChild(title);
    box.appendChild(del);
    box.appendChild(content);
    list.appendChild(box);
  });
}

// ===== OCR =====
async function readImage() {
  const file = document.getElementById("imageInput").files[0];
  if (!file) return;

  const { createWorker } = Tesseract;
  const worker = await createWorker("jpn");

  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  parseText(text);
}

function parseText(text) {
  const lines = text.split("\n");

  lines.forEach(line => {
    if (!line.includes("：") && !line.includes(":")) return;

    const [song, memberText] = line.split(/：|:/);

    const songName = song.trim();
    const memberList = memberText
      .split(/、|,|\s/)
      .map(m => m.trim())
      .filter(m => m);

    if (!songs.includes(songName)) {
      songs.push(songName);
      assignments[songName] = [];
    }

    memberList.forEach(m => {
      if (!members.includes(m)) members.push(m);
      if (!assignments[songName].includes(m)) {
        assignments[songName].push(m);
      }
    });
  });

  renderMembers();
  renderSongs();
}

// ===== セトリ =====
function canPlace(song, result, gap) {
  const membersOfSong = assignments[song];

  for (let i = Math.max(0, result.length - gap); i < result.length; i++) {
    const prevSong = result[i];
    if (!prevSong) continue;

    const prevMembers = assignments[prevSong];

    if (membersOfSong.some(m => prevMembers.includes(m))) {
      return false;
    }
  }
  return true;
}

function generateSetlist() {
  let remaining = [...songs];
  let result = [];

  while (remaining.length > 0) {
    let placed = false;

    for (let gap = 4; gap >= 1; gap--) {
      for (let i = 0; i < remaining.length; i++) {
        const song = remaining[i];

        if (canPlace(song, result, gap)) {
          result.push(song);
          remaining.splice(i, 1);
          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    if (!placed) {
      result.push(remaining.shift());
    }
  }

  renderResult(result);
}

function renderResult(list) {
  const box = document.getElementById("result");
  box.innerHTML = "";

  list.forEach((song, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${song}`;
    box.appendChild(div);
  });
}