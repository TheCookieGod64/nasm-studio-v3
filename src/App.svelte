<script>
  import { onMount } from 'svelte';

  // --- EDITOR STATE ---
  let code = ``; x86-64 NASM Studio v3
; Optimized for iPad 10 - Arch btw 🐧

section .data
    msg     db  "Hello Arch!", 10
    len     equ $ - msg

section .text
    global _start

_start:
    mov rax, 1        ; sys_write
    mov rdi, 1        ; stdout
    mov rsi, msg      ; address
    mov rdx, len      ; length
    syscall

    mov rax, 60       ; sys_exit
    xor rdi, rdi      ; code 0
    syscall`;

  // --- UI STATE ---
  let currentFile = 'main.asm';
  let files = ['main.asm', 'macros.inc', 'build.sh'];
  let sidebarCollapsed = false;
  let activeTab = 'term'; // term, regs, stack
  let kbActive = true;
  let kbMode = 'abc'; // abc, instr, regs, data, snip
  let shiftOn = false;

  // --- EMULATOR DATA (The Flex) ---
  let terminalLines = [
    "[INFO] Initializing NASM Studio v3...",
    "[INFO] WebAssembly Engine loaded.",
    "arch@ipad:~$ neofetch",
    "OS: Arch Linux (iPadOS Sandbox)",
    "Kernel: 6.9.420-arch-btw",
    "Shell: zsh (NASM Studio)",
    "CPU: Apple A14 Bionic (Virtual x86_64)",
    "Memory: 3911 MiB / 4096 MiB",
    "arch@ipad:~$ _"
  ];

  let regs = [
    {n: 'RAX', v: '0x000000000000003c'}, {n: 'RBX', v: '0x0000000000000000'},
    {n: 'RCX', v: '0x0000000000000000'}, {n: 'RDX', v: '0x000000000000000d'},
    {n: 'RSI', v: '0x0000000000402000'}, {n: 'RDI', v: '0x0000000000000001'},
    {n: 'RSP', v: '0x00007fffffffe000'}, {n: 'RIP', v: '0x0000000000401000'}
  ];

  // --- KEYBOARD LOGIC ---
  function type(t) {
    if (shiftOn && t.length === 1) t = t.toUpperCase();
    code += t;
    if (shiftOn) shiftOn = false;
  }
  function backspace() { code = code.slice(0, -1); }
  function enter() { code += "\n"; }
  function run() {
    terminalLines = [...terminalLines, `arch@ipad:~$ nasm -f elf64 ${currentFile}`, "arch@ipad:~$ ld main.o -o main", "arch@ipad:~$ ./main", "Hello Arch!"];
  }
</script>

<style>
  :root {
    --bg: #1a1b26; --bg2: #16161e; --bg3: #24283b; --bg4: #414868; --bg5: #13141d;
    --fg: #c0caf5; --fg2: #a9b1d6; --fg3: #565f89; --ac: #7aa2f7; --ac2: #bb9af7;
    --ac3: #7dcfff; --gr: #9ece6a; --rd: #f7768e; --yl: #e0af68; --arch: #1793d1;
  }

  :global(body) { margin: 0; background: var(--bg); color: var(--fg); font-family: 'JetBrains Mono', 'SF Mono', monospace; height: 100dvh; overflow: hidden; }

  .layout { display: flex; flex-direction: column; height: 100%; }

  /* HEADER */
  header { height: 48px; background: var(--bg2); border-bottom: 1px solid #333; display: flex; align-items: center; padding: 0 15px; gap: 12px; }
  .logo { color: var(--ac); font-weight: 800; font-size: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
  .logo span { color: var(--arch); font-size: 22px; }
  .btn-run { background: var(--gr); color: #000; border: none; padding: 6px 20px; border-radius: 6px; font-weight: 900; font-size: 12px; cursor: pointer; transition: 0.1s; }
  .btn-run:active { transform: scale(0.95); background: #76a858; }

  /* MAIN WORKSPACE */
  .main-container { flex: 1; display: flex; overflow: hidden; }

  .sidebar { width: 220px; background: var(--bg2); border-right: 1px solid #222; display: flex; flex-direction: column; transition: 0.3s; }
  .sidebar.collapsed { width: 0; }
  .sidebar-title { padding: 15px; font-size: 10px; color: var(--fg3); text-transform: uppercase; font-weight: bold; }
  .file-link { padding: 10px 15px; font-size: 13px; color: var(--fg2); display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .file-link.active { background: var(--bg3); border-left: 3px solid var(--ac); color: var(--fg); }

  .editor-pane { flex: 1; display: flex; flex-direction: column; background: var(--bg); position: relative; }
  textarea { flex: 1; background: transparent; color: var(--fg); border: none; padding: 20px; font-size: 16px; line-height: 1.5; outline: none; resize: none; tab-size: 4; }

  .right-panel { width: 400px; background: var(--bg5); border-left: 1px solid #333; display: flex; flex-direction: column; }
  .panel-tabs { display: flex; background: var(--bg2); height: 36px; border-bottom: 1px solid #333; }
  .p-tab { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: var(--fg3); cursor: pointer; }
  .p-tab.active { color: var(--ac); border-bottom: 2px solid var(--ac); background: var(--bg3); }

  .terminal { flex: 1; padding: 15px; font-size: 12px; overflow-y: auto; color: #fff; }
  .reg-row { display: flex; padding: 6px 12px; border-bottom: 1px solid #222; font-size: 11px; }
  .reg-name { color: var(--ac3); width: 50px; font-weight: bold; }
  .reg-val { color: var(--yl); font-family: monospace; }

  /* ULTIMATE KEYBOARD */
  .kb-container { background: var(--bg5); border-top: 3px solid var(--bd); padding: 10px; display: flex; flex-direction: column; gap: 6px; }
  .kb-modes { display: flex; gap: 4px; margin-bottom: 4px; }
  .mode-btn { flex: 1; padding: 10px; border: none; background: var(--bg2); color: var(--fg3); border-radius: 6px; font-size: 11px; font-weight: bold; }
  .mode-btn.active { background: var(--ac); color: var(--bg); }
  
  .row { display: flex; gap: 5px; }
  .key { flex: 1; height: 50px; background: var(--bg4); border: 1px solid rgba(255,255,255,0.05); color: #fff; border-radius: 8px; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 0 #000; }
  .key:active { transform: translateY(2px); box-shadow: 0 1px 0 #000; background: var(--ac); color: #000; }
  .key-wide { flex: 2; }
  .key-blue { color: var(--ac3); }
  .key-green { color: var(--gr); }
  .key-purple { color: var(--ac2); }

  /* STATUS BAR */
  footer { height: 26px; background: var(--ac); color: #000; display: flex; align-items: center; padding: 0 15px; font-size: 11px; font-weight: bold; z-index: 100; }
</style>

<div class="layout">
  <!-- TOP BAR -->
  <header>
    <div class="logo"><span>⟁</span> x64 NASM STUDIO <span style="background:var(--ac); color:#000; font-size:9px; padding:2px 6px; border-radius:4px">V3</span></div>
    <button on:click={toggleSidebar} style="background:none; border:none; color:white; font-size:18px">☰</button>
    <div style="flex:1"></div>
    <button on:click={run} class="btn-run">▶ RUN PROJECT</button>
    <button style="background:var(--rd); border:none; width:30px; height:30px; border-radius:50%; color:white; font-weight:bold">×</button>
  </header>

  <div class="main-container">
    <!-- FILE EXPLORER -->
    <div class="sidebar" class:collapsed={sidebarCollapsed}>
      <div class="sidebar-title">Explorer</div>
      {#each files as file}
        <div class="file-link" class:active={file === currentFile}>
          <span style="color:var(--yl)">{file.endsWith('.asm') ? 'λ' : '⚙'}</span> {file}
        </div>
      {/each}
      <div style="margin-top:auto; padding:20px; font-size:10px; color:var(--fg3)">Arch btw 🐧</div>
    </div>

    <!-- CODE EDITOR -->
    <div class="editor-pane">
      <textarea 
        bind:value={code} 
        spellcheck="false" 
        on:focus={() => kbActive = true}
        inputmode={kbActive ? "none" : "text"}
      ></textarea>
    </div>

    <!-- RIGHT PANEL (Terminal/Registers) -->
    <div class="right-panel">
      <div class="panel-tabs">
        <div class="p-tab" class:active={activeTab==='term'} on:click={()=>activeTab='term'}>TERMINAL</div>
        <div class="p-tab" class:active={activeTab==='regs'} on:click={()=>activeTab='regs'}>REGISTERS</div>
      </div>

      {#if activeTab === 'term'}
        <div class="terminal">
          {#each terminalLines as line}
            <div style="margin-bottom:6px; {line.startsWith('arch') ? 'color:var(--gr)' : ''}">{line}</div>
          {/each}
        </div>
      {:else}
        <div style="overflow-y:auto">
          <div style="padding:10px; font-size:10px; color:var(--fg3); background:#111">CPU STATE (X86_64)</div>
          {#each regs as reg}
            <div class="reg-row">
              <span class="reg-name">{reg.n}</span>
              <span class="reg-val">{reg.v}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- CUSTOM IPAD ASSEMBLY KEYBOARD -->
  {#if kbActive}
    <div class="kb-container">
      <div class="kb-modes">
        <button class="mode-btn" class:active={kbMode==='abc'} on:click={()=>kbMode='abc'}>ABC</button>
        <button class="mode-btn" class:active={kbMode==='instr'} on:click={()=>kbMode='instr'}>INSTR</button>
        <button class="mode-btn" class:active={kbMode==='regs'} on:click={()=>kbMode='regs'}>REGS</button>
        <button class="mode-btn" class:active={kbMode==='data'} on:click={()=>kbMode='data'}>DATA</button>
        <button class="mode-btn" class:active={kbMode==='snip'} on:click={()=>kbMode='snip'}>SNIP</button>
        <button class="mode-btn" style="background:var(--rd); color:white; flex:none; width:40px" on:click={()=>kbActive=false}>✕</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:5px">
        {#if kbMode === 'abc'}
          <div class="row">
            {#each ['q','w','e','r','t','y','u','i','o','p'] as k}<button class="key" on:click={()=>type(k)}>{k}</button>{/each}
          </div>
          <div class="row">
            {#each ['a','s','d','f','g','h','j','k','l'] as k}<button class="key" on:click={()=>type(k)}>{k}</button>{/each}
          </div>
          <div class="row">
            <button class="key" class:active={shiftOn} on:click={()=>shiftOn = !shiftOn}>⇧</button>
            {#each ['z','x','c','v','b','n','m',',','.','/'] as k}<button class="key" on:click={()=>type(k)}>{k}</button>{/each}
            <button class="key" on:click={backspace}>⌫</button>
          </div>
        {/if}

        {#if kbMode === 'instr'}
          <div class="row">
            {#each ['mov','add','sub','xor'] as k}<button class="key key-blue" on:click={()=>type(k+' ')}>{k}</button>{/each}
          </div>
          <div class="row">
            {#each ['lea','cmp','jmp','call'] as k}<button class="key key-blue" on:click={()=>type(k+' ')}>{k}</button>{/each}
          </div>
          <div class="row">
            <button class="key key-blue key-wide" on:click={()=>type('syscall')}>SYSCALL</button>
            <button class="key key-blue" on:click={()=>type('ret')}>ret</button>
            <button class="key" on:click={backspace}>⌫</button>
          </div>
        {/if}

        {#if kbMode === 'regs'}
          <div class="row">
            {#each ['rax','rbx','rcx','rdx'] as r}<button class="key key-green" on:click={()=>type(r)}>{r}</button>{/each}
          </div>
          <div class="row">
            {#each ['rsi','rdi','rbp','rsp'] as r}<button class="key key-green" on:click={()=>type(r)}>{r}</button>{/each}
          </div>
          <div class="row">
            {#each ['r8','r9','r10','r11'] as r}<button class="key key-green" on:click={()=>type(r)}>{r}</button>{/each}
            <button class="key" on:click={backspace}>⌫</button>
          </div>
        {/if}

        {#if kbMode === 'data'}
          <div class="row">
            {#each ['section .text','section .data','global _start'] as d}<button class="key key-purple" on:click={()=>type(d+'\n')}>{d}</button>{/each}
          </div>
          <div class="row">
            {#each ['db','dw','dd','dq','equ','$ -'] as d}<button class="key key-purple" on:click={()=>type(d+' ')}>{d}</button>{/each}
            <button class="key" on:click={backspace}>⌫</button>
          </div>
        {/if}

        <div class="row">
          <button class="key" style="background:#333" on:click={()=>type('    ')}>TAB</button>
          <button class="key key-wide" style="background:#333" on:click={()=>type(' ')}>SPACE</button>
          <button class="key key-wide" style="background:var(--ac); color:#000" on:click={enter}>ENTER</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- STATUS BAR -->
  <footer>
    <span style="color:var(--bg)">⟁ {currentFile}</span>
    <span style="margin-left:20px; opacity:0.7">x86_64-linux-nasm</span>
    <div style="flex:1"></div>
    <span style="color:var(--bg)">BTW, I USE ARCH</span>
  </footer>
</div>