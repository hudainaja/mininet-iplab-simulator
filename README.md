# Mininet-IPLab Web 🌐

A high-performance, interactive, 100% client-side web clone of **Mininet-IPLab** designed for practicing Computer Network Lab Exams (OSPF, iBGP, Open vSwitch VLAN, 6in4 SIT Tunnel, and Static Routing).

Zero external backend dependencies — deployable straight to **Vercel** with a single click.

---

## ⚡ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Topology Canvas**: [@xyflow/react](https://reactflow.dev/) (React Flow) with custom Router, Switch, and Host nodes
- **Terminal UI**: Multi-tab Terminal emulator with ANSI colors, history (Up/Down), tab autocompletion, quick command snippets, and font scaling
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Packet & Routing Engine**: Client-side Dijkstra SPF, iBGP BGP Finite State Machine, Open vSwitch VLAN tagging, and 6in4 SIT tunnel encapsulation

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Vercel Deployment
```bash
npm run build
```
Since the entire network state engine, packet routing simulator, and CLI parser run client-side, this project builds directly into static files that can be deployed to Vercel, Netlify, or GitHub Pages.

---

## 🛠️ Features & Labs

### 1. Built-in Lab Presets
- **UTP Exam Topology (18 Nodes)**:
  - 3 Core Routers (`r1`, `r2`, `r3`) connected in an equilateral triangle mesh (Area 0, AS 65000).
  - 3 Open vSwitch Switches (`s1`, `s2`, `s3`) isolating edge traffic with VLAN 10 & VLAN 20.
  - 6 Edge Routers (`r11`, `r12`, `r21`, `r22`, `r31`, `r32`).
  - 6 Host Workstations (`c11`, `c12`, `c21`, `c22`, `c31`, `c32`).
- **Static Routing Lab (4 Nodes)**:
  - Linear `h1 - r1 - r2 - h2` topology for testing gateway and static routing table entries.
- **Blank Canvas / Custom Mode**:
  - Drag and drop or create arbitrary routers, switches, and hosts, wire links dynamically, and run custom network experiments.

---

## 💻 CLI Commands Cheatsheet

### 1. Router CLI (FRRouting vtysh style)
- **Navigation**: `enable`, `disable`, `configure terminal` (`conf t`), `exit`, `end`
- **Interfaces**:
  - `interface <intf>` (e.g. `interface r1-eth1` or `interface lo`)
  - `ip address <ip>/<prefix>` (e.g. `ip address 10.12.0.1/30`)
  - `no shutdown` / `shutdown`
  - `ip ospf cost <cost>`
- **OSPF (Area 0)**:
  - `router ospf`
  - `ospf router-id <id>` (e.g. `ospf router-id 1.1.1.1`)
  - `network <net>/<prefix> area <area>` (e.g. `network 10.12.0.0/30 area 0`)
  - `show ip ospf neighbor` (dynamically verifies FULL/DR adjacency)
  - `show ip route ospf` (computes least-cost Dijkstra SPF routes)
- **iBGP (AS 65000)**:
  - `router bgp <asn>`
  - `bgp router-id <id>`
  - `neighbor <ip> remote-as <asn>`
  - `neighbor <ip> update-source <intf>` (e.g. `update-source lo`)
  - `neighbor <ip> next-hop-self`
  - `network <net>/<prefix>`
  - `show ip bgp summary` (shows `Established` state and prefix count)
  - `show ip bgp`
- **Static Routing & Diagnostics**:
  - `ip route <dest>/<prefix> <next_hop>`
  - `show ip route`
  - `show interface brief`
  - `show running-config`
  - `ping <target_ip>` / `traceroute <target_ip>`

### 2. Switch CLI (Open vSwitch)
- `ovs-vsctl show`
- `ovs-vsctl set port <port> tag=<vlan_id>` (e.g. `ovs-vsctl set port s1-eth2 tag=10`)
- `ovs-vsctl remove port <port> tag <vlan_id>`
- `ovs-ofctl dump-flows <bridge>`
- `show interface`

### 3. Host CLI (Linux Bash)
- `ip addr show` / `ifconfig`
- `ip addr add <ip>/<prefix> dev <intf>`
- `ip -6 addr add <ipv6>/<prefix> dev <intf>`
- `ip link set <intf> up`
- `ip route add default via <ip>`
- **6in4 SIT Tunnel**:
  - `ip tunnel add <tun> mode sit remote <remote_ip> local <local_ip> ttl 255`
  - `ip -6 route add <ipv6_prefix> dev <tun>`
  - `ip tunnel show`
- `ping <target_ip>`
- `ping6 <target_ipv6>`
- `traceroute <target_ip>`

---

## 🏆 Automated Verification Suite
Click **"Verify Lab"** on the top navigation bar to execute automated test assertions:
1. Core mesh adjacency pings (`r1` ⟷ `r2`, `r2` ⟷ `r3`, `r1` ⟷ `r3`)
2. Local Host to Gateway reachability (`c11` ⟷ `r11`)
3. Multi-hop end-to-end OSPF & iBGP routing (`c11` ⟷ `c31`)
4. 6in4 SIT IPv6 Tunnel encapsulation transit (`c11` ⟷ `c31` over SIT)

---

## 📄 License
MIT. Created for Universitas Brawijaya Computer Network Laboratory practice.
