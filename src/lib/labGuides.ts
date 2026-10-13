export interface LabGuideItem {
  id: string;
  title: string;
  module: string;
  summary: string;
  content: string;
}

export const LAB_GUIDES: LabGuideItem[] = [
  {
    id: 'utp-guide',
    title: 'UTP Exam Master Guide (18 Nodes)',
    module: 'Exam Preparation',
    summary: 'Arsitektur, tabel IP scheme, VLAN OVS, OSPF Cost, iBGP AS 65000, 6in4 SIT Tunnel, & verifikasi.',
    content: `# Ujian Tengah Praktikum (UTP) - Jaringan Komputer

Gunakan panduan ini saat simulasi berjalan. Klik nama node di daftar perangkat atau canvas untuk membuka terminal masing-masing.

---

### Tujuan Pembelajaran
- Membangun interkoneksi router backbone dengan skema IP Point-to-Point (/30) dan Loopback.
- Mengonfigurasi trunking & access VLAN pada Open vSwitch untuk segmentasi jaringan.
- Menerapkan OSPF Area 0 dinamis dan manipulasi OSPF Cost untuk rekayasa jalur.
- Membangun peering full-mesh iBGP (AS 65000) menggunakan antarmuka Loopback.
- Membangun SIT Tunnel 6in4 untuk melewatkan lalu lintas IPv6 melintasi inti IPv4.

---

### Gambaran Arsitektur Jaringan
- **Core Backbone (Segitiga Inti):** \`r1\`, \`r2\`, dan \`r3\` terhubung full-mesh segitiga (OSPF Area 0, iBGP AS 65000).
- **Distribusi & Switch:** \`s1\`, \`s2\`, dan \`s3\` (Open vSwitch) memisahkan segmen LAN cabang menggunakan VLAN 10 dan VLAN 20.
- **Edge Access:** Enam router cabang (\`r11\`–\`r32\`) sebagai gateway masing-masing host client (\`c11\`–\`c32\`).

---

### Tabel Alokasi Pengalamatan (IP Scheme)

| Perangkat | Interface | Alamat IP / Prefix | Peran / Keterangan |
| :--- | :--- | :--- | :--- |
| **r1** | \`lo\` | \`1.1.1.1/32\` | Router-ID & Peering BGP |
| | \`r1-eth1\` | \`10.12.0.1/30\` | P2P link ke r2 |
| | \`r1-eth2\` | \`10.13.0.1/30\` | P2P link ke r3 (Endpoint 6in4) |
| | \`r1-eth3\` | \`10.1.0.1/24\` | Gateway link ke Switch s1 |
| **r2** | \`lo\` | \`2.2.2.2/32\` | Router-ID & Peering BGP |
| | \`r2-eth1\` | \`10.12.0.2/30\` | P2P link ke r1 |
| | \`r2-eth2\` | \`10.23.0.1/30\` | P2P link ke r3 |
| | \`r2-eth3\` | \`10.2.0.1/24\` | Gateway link ke Switch s2 |
| **r3** | \`lo\` | \`3.3.3.3/32\` | Router-ID & Peering BGP |
| | \`r3-eth1\` | \`10.13.0.2/30\` | P2P link ke r1 (Endpoint 6in4) |
| | \`r3-eth2\` | \`10.23.0.2/30\` | P2P link ke r2 |
| | \`r3-eth3\` | \`10.3.0.1/24\` | Gateway link ke Switch s3 |
| **r11 / r12** | \`eth1\` | \`10.1.0.11/24\` / \`10.1.0.12/24\` | Link s1 (r11: VLAN 10, r12: VLAN 20) |
| | \`eth2\` | \`192.168.11.1/24\` / \`192.168.12.1/24\` | LAN Gateway c11 / c12 |
| **c11 / c12** | \`eth0\` | \`192.168.11.2/24\` / \`192.168.12.2/24\` | Host Client Cabang 1 |
| **c21 / c22** | \`eth0\` | \`192.168.21.2/24\` / \`192.168.22.2/24\` | Host Client Cabang 2 |
| **c31 / c32** | \`eth0\` | \`192.168.31.2/24\` / \`192.168.32.2/24\` | Host Client Cabang 3 |

---

### Alur Konfigurasi Bertahap

#### Langkah 1 — Segmentasi Switch VLAN (Open vSwitch)
Di terminal \`s1\`, pisahkan lalu lintas router cabang dengan menetapkan tag VLAN port:
\`\`\`bash
ovs-vsctl set port s1-eth2 tag=10
ovs-vsctl set port s1-eth3 tag=20
ovs-vsctl show
\`\`\`
*(Ulangi langkah serupa pada \`s2\` dan \`s3\` untuk memisahkan traffic cabang 2 dan 3)*.

#### Langkah 2 — Routing Dinamis OSPF Area 0 & Rekayasa Cost
Aktifkan OSPF pada core router untuk pertukaran rute loopback dan link antar-router:
\`\`\`bash
r1# conf t
r1(config)# router ospf
r1(config-router)# ospf router-id 1.1.1.1
r1(config-router)# network 10.12.0.0/30 area 0
r1(config-router)# network 10.13.0.0/30 area 0
r1(config-router)# network 10.1.0.0/24 area 0
r1(config-router)# network 1.1.1.1/32 area 0
r1(config-router)# exit
r1(config)# interface r1-eth1
r1(config-if)# ip ospf cost 50
r1(config-if)# exit
\`\`\`
Verifikasi status adjacency dan rute OSPF:
\`\`\`bash
r1# show ip ospf neighbor
r1# show ip route ospf
\`\`\`

#### Langkah 3 — Peering Full-Mesh iBGP (AS 65000)
Bangun peering iBGP antar-core router menggunakan antarmuka Loopback sebagai update-source:
\`\`\`bash
r1# conf t
r1(config)# router bgp 65000
r1(config-router)# bgp router-id 1.1.1.1
r1(config-router)# neighbor 2.2.2.2 remote-as 65000
r1(config-router)# neighbor 2.2.2.2 update-source lo
r1(config-router)# neighbor 2.2.2.2 next-hop-self
r1(config-router)# neighbor 3.3.3.3 remote-as 65000
r1(config-router)# neighbor 3.3.3.3 update-source lo
r1(config-router)# neighbor 3.3.3.3 next-hop-self
r1(config-router)# network 192.168.11.0/24
r1(config-router)# network 192.168.12.0/24
r1(config-router)# exit
\`\`\`
Verifikasi status session BGP (pastikan State mencapai **Established**):
\`\`\`bash
r1# show ip bgp summary
r1# show ip bgp
\`\`\`

#### Langkah 4 — SIT Tunnel 6in4 (IPv6 over IPv4)
Bangun terowongan transmisi IPv6 melewati backbone IPv4 antara \`r1\` dan \`r3\`:
\`\`\`bash
# Pada router r1:
ip tunnel add tunnel_dc_as_65000 mode sit remote 10.13.0.2 local 10.13.0.1 ttl 255
ip link set tunnel_dc_as_65000 up
ip -6 addr add 2001:db8:100::1/64 dev tunnel_dc_as_65000
ip -6 route add 2001:db8:200::/48 dev tunnel_dc_as_65000
\`\`\`

#### Langkah 5 — Pengujian & Verifikasi End-to-End
Uji konektivitas multi-hop dari host client:
\`\`\`bash
# Ping IPv4 antar host cabang 1 ke cabang 3:
root@c11:~# ping 192.168.31.2

# Ping IPv6 melalui SIT Tunnel:
root@c11:~# ping6 2001:db8:200::10

# Traceroute untuk memastikan hop yang dilalui:
root@c11:~# traceroute 192.168.31.2
\`\`\`
`
  },
  {
    id: 'modul-1',
    title: 'Modul 1: Konfigurasi Static Routing',
    module: 'Modul 1',
    summary: 'Penetapan IP address interface, no shutdown, dan routing static.',
    content: `# Modul 1: Konfigurasi Router & Static Routing

## Langkah-langkah Praktikum:
1. Masuk ke mode privileged dan configuration:
\`\`\`bash
r1> enable
r1# configure terminal
\`\`\`

2. Konfigurasi IP Interface:
\`\`\`bash
r1(config)# interface r1-eth0
r1(config-if)# ip address 192.168.1.1/24
r1(config-if)# no shutdown
r1(config-if)# exit

r1(config)# interface r1-eth1
r1(config-if)# ip address 10.0.0.1/30
r1(config-if)# no shutdown
r1(config-if)# exit
\`\`\`

3. Tambahkan Static Route ke jaringan tujuan:
\`\`\`bash
r1(config)# ip route 192.168.2.0/24 10.0.0.2
r1(config)# exit
\`\`\`

4. Verifikasi Routing Table:
\`\`\`bash
r1# show ip route
r1# show interface brief
\`\`\`
`
  },
  {
    id: 'modul-2',
    title: 'Modul 2: Konfigurasi Open vSwitch & VLAN',
    module: 'Modul 2',
    summary: 'Isolasi port switch menggunakan tag VLAN Open vSwitch (ovs-vsctl).',
    content: `# Modul 2: Konfigurasi Switch dan Host (VLAN)

Open vSwitch (OVS) digunakan sebagai switch virtual pada Mininet.

## 1. Perintah Dasar Open vSwitch:
- Melihat status bridge dan port:
\`\`\`bash
s1# ovs-vsctl show
\`\`\`

- Menetapkan Tag VLAN pada port access:
\`\`\`bash
s1# ovs-vsctl set port s1-eth2 tag=10
s1# ovs-vsctl set port s1-eth3 tag=20
\`\`\`

- Menghapus Tag VLAN:
\`\`\`bash
s1# ovs-vsctl remove port s1-eth2 tag 10
\`\`\`

## 2. Pengujian Isolasi VLAN:
- Host pada VLAN 10 tidak dapat melakukan ping langsung ke host pada VLAN 20 pada layer 2 tanpa melalui router (Inter-VLAN routing).
`
  },
  {
    id: 'modul-3',
    title: 'Modul 3: Konfigurasi OSPF Single Area',
    module: 'Modul 3',
    summary: 'Dynamic routing OSPF Area 0, router-id, cost metric, dan Dijkstra SPF.',
    content: `# Modul 3: Open Shortest Path First (OSPF)

OSPF adalah protokol routing Interior Gateway Protocol (IGP) berbasis link-state algorithm (Dijkstra SPF).

## 1. Konfigurasi OSPF:
\`\`\`bash
r1# conf t
r1(config)# router ospf
r1(config-router)# ospf router-id 1.1.1.1
r1(config-router)# network 10.12.0.0/30 area 0
r1(config-router)# network 10.13.0.0/30 area 0
r1(config-router)# exit
\`\`\`

## 2. Mengubah Cost Metric Interface:
\`\`\`bash
r1(config)# interface r1-eth1
r1(config-if)# ip ospf cost 50
\`\`\`

## 3. Verifikasi Status OSPF:
- Cek neighbor adjacency (Harus mencapai state **Full/DR** atau **Full/BDR**):
\`\`\`bash
r1# show ip ospf neighbor
\`\`\`

- Cek rute OSPF yang dipelajari:
\`\`\`bash
r1# show ip route ospf
\`\`\`
`
  },
  {
    id: 'modul-4',
    title: 'Modul 4: Konfigurasi 6in4 Tunnel (SIT)',
    module: 'Modul 4',
    summary: 'Enkapsulasi paket IPv6 di dalam paket IPv4 (Simple Internet Transition / SIT).',
    content: `# Modul 4: Konfigurasi 6in4 Tunnel

6in4 (SIT mode) memungkinkan dua pulau IPv6 berkomunikasi melalui infrastruktur internet IPv4.

## 1. Konfigurasi Tunnel SIT di Linux:
\`\`\`bash
# Buat interface tunnel
ip tunnel add tun1 mode sit remote 10.13.0.2 local 10.13.0.1 ttl 255

# Aktifkan interface
ip link set tun1 up

# Berikan alamat IPv6 pada tunnel
ip -6 addr add 2001:db8:100::1/64 dev tun1

# Tambahkan route prefix tujuan melalui tunnel
ip -6 route add 2001:db8:200::/48 dev tun1
\`\`\`

## 2. Verifikasi Tunnel:
\`\`\`bash
ip tunnel show
ip -6 route show
ping6 2001:db8:200::1
\`\`\`
`
  },
  {
    id: 'modul-5',
    title: 'Modul 5: Konfigurasi iBGP',
    module: 'Modul 5',
    summary: 'Internal BGP peering, loopback update-source, next-hop-self, dan pertukaran prefix.',
    content: `# Modul 5: Konfigurasi iBGP (Internal BGP)

iBGP beroperasi di dalam Autonomous System (AS) yang sama. Untuk mencegah routing blackhole, gunakan peering mesh dengan update-source loopback.

## 1. Konfigurasi iBGP di FRRouting:
\`\`\`bash
r1# conf t
r1(config)# router bgp 65000
r1(config-router)# bgp router-id 1.1.1.1
r1(config-router)# neighbor 2.2.2.2 remote-as 65000
r1(config-router)# neighbor 2.2.2.2 update-source lo
r1(config-router)# neighbor 2.2.2.2 next-hop-self
r1(config-router)# network 192.168.11.0/24
\`\`\`

## 2. Status Neighbor:
Status harus mencapai **Established** (menampilkan jumlah prefix).
\`\`\`bash
r1# show ip bgp summary
r1# show ip bgp
\`\`\`
`
  }
];
