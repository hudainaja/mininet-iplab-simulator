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
    summary: 'Full addressing table, OSPF, iBGP, VLAN, 6in4 SIT Tunnel, and verification checklist.',
    content: `# Ujian Tengah Praktikum (UTP) - Jaringan Komputer

## 1. Ringkasan Topologi (18 Nodes)
- **3 Core Routers**: \`r1\`, \`r2\`, \`r3\` terhubung full-mesh segitiga (Area 0, AS 65000).
- **3 Switches (Open vSwitch)**: \`s1\`, \`s2\`, \`s3\` memisahkan traffic access dengan VLAN 10 & 20.
- **6 Edge Routers**: \`r11\`, \`r12\` (s1), \`r21\`, \`r22\` (s2), \`r31\`, \`r32\` (s3).
- **6 Hosts**: \`c11\`, \`c12\`, \`c21\`, \`c22\`, \`c31\`, \`c32\`.

---

## 2. Tabel Pengalamatan (IP Scheme)

### Core Router Interconnections (/30):
- \`r1-eth1\` (10.12.0.1/30) <---> \`r2-eth1\` (10.12.0.2/30)
- \`r2-eth2\` (10.23.0.1/30) <---> \`r3-eth2\` (10.23.0.2/30)
- \`r1-eth2\` (10.13.0.1/30) <---> \`r3-eth1\` (10.13.0.2/30)

### Distribution Subnets (/24 via Switch):
- \`s1\`: \`r1-eth3\` (10.1.0.1/24), \`r11-eth1\` (10.1.0.11/24 tag 10), \`r12-eth1\` (10.1.0.12/24 tag 20)
- \`s2\`: \`r2-eth3\` (10.2.0.1/24), \`r21-eth1\` (10.2.0.21/24 tag 10), \`r22-eth1\` (10.2.0.22/24 tag 20)
- \`s3\`: \`r3-eth3\` (10.3.0.1/24), \`r31-eth1\` (10.3.0.31/24 tag 10), \`r32-eth1\` (10.3.0.32/24 tag 20)

### Host LAN Subnets (/24):
- \`r11-eth2\` (192.168.11.1/24) <---> \`c11-eth0\` (192.168.11.2/24, GW: 192.168.11.1)
- \`r12-eth2\` (192.168.12.1/24) <---> \`c12-eth0\` (192.168.12.2/24, GW: 192.168.12.1)
- \`r21-eth2\` (192.168.21.1/24) <---> \`c21-eth0\` (192.168.21.2/24, GW: 192.168.21.1)
- \`r22-eth2\` (192.168.22.1/24) <---> \`c22-eth0\` (192.168.22.2/24, GW: 192.168.22.1)
- \`r31-eth2\` (192.168.31.1/24) <---> \`c31-eth0\` (192.168.31.2/24, GW: 192.168.31.1)
- \`r32-eth2\` (192.168.32.1/24) <---> \`c32-eth0\` (192.168.32.2/24, GW: 192.168.32.1)

---

## 3. Konfigurasi OSPF (Area 0)
Di Core Router (contoh pada \`r1\`):
\`\`\`bash
r1# conf t
r1(config)# router ospf
r1(config-router)# ospf router-id 1.1.1.1
r1(config-router)# network 10.12.0.0/30 area 0
r1(config-router)# network 10.13.0.0/30 area 0
r1(config-router)# network 10.1.0.0/24 area 0
r1(config-router)# network 1.1.1.1/32 area 0
r1(config-router)# exit
\`\`\`

Verifikasi OSPF:
\`\`\`bash
r1# show ip ospf neighbor
r1# show ip route ospf
\`\`\`

---

## 4. Konfigurasi iBGP (AS 65000)
Gunakan Loopback (\`lo\`) sebagai update-source agar peering tetap hidup jika salah satu link fisik down!

Di \`r1\`:
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
\`\`\`

Verifikasi iBGP:
\`\`\`bash
r1# show ip bgp summary
r1# show ip bgp
\`\`\`

---

## 5. Konfigurasi VLAN Open vSwitch
Di switch \`s1\`:
\`\`\`bash
s1# ovs-vsctl set port s1-eth2 tag=10
s1# ovs-vsctl set port s1-eth3 tag=20
s1# ovs-vsctl show
\`\`\`

---

## 6. Konfigurasi 6in4 SIT Tunnel
Membuat tunnel IPv6 melalui jaringan backbone IPv4 antara \`r1\` (10.13.0.1) dan \`r3\` (10.13.0.2):

Di router / host \`r1\`:
\`\`\`bash
ip tunnel add tunnel_dc_as_65000 mode sit remote 10.13.0.2 local 10.13.0.1 ttl 255
ip link set tunnel_dc_as_65000 up
ip -6 addr add 2001:db8:100::1/64 dev tunnel_dc_as_65000
ip -6 route add 2001:db8:200::/48 dev tunnel_dc_as_65000
\`\`\`

Di host \`c11\` (IPv6 Client):
\`\`\`bash
ip -6 addr add 2001:db8:100::10/64 dev c11-eth0
ip -6 route add 2001:db8:200::/48 dev c11-eth0
ping6 2001:db8:200::10
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
Status harus berubah dari \`Active\` atau \`Connect\` menjadi **Established** (menampilkan jumlah prefix).
\`\`\`bash
r1# show ip bgp summary
r1# show ip bgp
\`\`\`
`
  }
];
