import './App.css'
import { Routes, Route, useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'

// 模拟患者数据
const mockPatients = [
  {
    id: '000004',
    name: '刘六',
    phone: '18812345555',
    gender: '男',
    age: 58,
    surgeryType: '生物瓣膜',
    surgeryDate: '2024/02/28',
    dischargeDate: '2024/03/15',
    latestINR: 3.0,
    testDate: '2025/04/10',
    currentDose: '2片',
    suggestedDose: '异常',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000004', dose: '2片', inr: 3.0, testDate: '2025/04/10', sysDose: '2片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000003',
    name: '王五',
    phone: '18812343333',
    gender: '女',
    age: 70,
    surgeryType: '生物瓣膜',
    surgeryDate: '2024/12/06',
    dischargeDate: '2024/12/15',
    latestINR: 1.3,
    testDate: '2025/06/10',
    currentDose: '2片',
    suggestedDose: '2.25片',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000003', dose: '2片', inr: 1.3, testDate: '2025/06/10', sysDose: '2.25片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000002',
    name: '李四',
    phone: '18812346666',
    gender: '女',
    age: 65,
    surgeryType: '机械瓣膜',
    surgeryDate: '2025/05/06',
    dischargeDate: '2025/05/15',
    latestINR: 1.9,
    testDate: '2025/05/31',
    currentDose: '2片',
    suggestedDose: '1.75片',
    status: '待认',
    initialDose: '2片',
    history: '无',
    records: [
      { id: '9000002', dose: '2片', inr: 1.9, testDate: '2025/05/31', sysDose: '1.75片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
    ],
  },
  {
    id: '000001',
    name: '张三',
    phone: '18812345678',
    gender: '男',
    age: 60,
    surgeryType: '生物瓣膜',
    surgeryDate: '2025/01/05',
    dischargeDate: '2025/01/25',
    latestINR: 1.5,
    testDate: '2025/04/01',
    currentDose: '2片',
    suggestedDose: '2片',
    status: '待认',
    initialDose: '2片',
    history: '患者都有主动脉夹层，围绕生物瓣膜，需终身服用华法林',
    records: [
      { id: '9000005', dose: '2片', inr: 1.7, testDate: '2025/04/10', sysDose: '2片', confirmStatus: '已确认', doctorDose: '2片', note: '', op: '' },
      { id: '9000004', dose: '2片', inr: 1.8, testDate: '2025/04/05', sysDose: '2片', confirmStatus: '已确认', doctorDose: '2片', note: '', op: '' },
      { id: '9000003', dose: '2片', inr: 1.0, testDate: '2025/03/25', sysDose: '2片', confirmStatus: '待确认', doctorDose: '', note: '', op: '' },
      { id: '9000002', dose: '2片', inr: 2.0, testDate: '2025/02/25', sysDose: '1.75片', confirmStatus: '已确认', doctorDose: '1.75', note: '', op: '' },
      { id: '9000001', dose: '2片', inr: 1.5, testDate: '2025/01/25', sysDose: '', confirmStatus: '', doctorDose: '2片', note: '患者出院', op: '' },
    ],
  },
]

// 新增：状态徽标组件
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: { text: string, className: string } } = {
    pending: { text: '待确认', className: 'status-pending' },
    active: { text: '已确认', className: 'status-confirmed' },
    rejected: { text: '已拒绝', className: 'status-rejected' },
  };

  const { text, className } = statusMap[status] || { text: status, className: '' };

  return (
    <span className={`status-badge ${className}`}>{text}</span>
  );
};

// 公共辅助函数：计算年龄
const calculateAge = (dob: string | null) => {
  if (!dob) return 'N/A';
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (e) {
    return 'N/A';
  }
};

function Sidebar() {
  const location = useLocation()
  const getLinkClass = (path: string) => {
    if (path === '/' && location.pathname.startsWith('/patient/')) {
      return 'sidebar-item active'
    }
    return location.pathname === path ? 'sidebar-item active' : 'sidebar-item'
  }
  return (
    <aside className="sidebar">
      <div className="sidebar-title">芒夏Admin</div>
      <NavLink to="/" className={getLinkClass('/')}>患者列表</NavLink>
      <NavLink to="/add-patient" className={getLinkClass('/add-patient')}>新增患者</NavLink>
    </aside>
  )
}

function PatientListPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          const formattedData = result.data.map((p: any) => ({
            id: p.patient_id || '无ID',
            name: p.patient_name || '无姓名',
            phone: p.phone_number || '无手机号',
            gender: p.gender === 'male' ? '男' : '女',
            age: calculateAge(p.date_of_birth),
            surgeryType: p.surgery_type || 'N/A',
            surgeryDate: p.operation_date || 'N/A',
            dischargeDate: p.discharge_date || 'N/A',
            latestINR: 'N/A',
            testDate: 'N/A',
            currentDose: 'N/A',
            suggestedDose: 'N/A',
          }))
          setPatients(formattedData)
        } else {
          throw new Error(result.message || 'Failed to fetch patients')
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error)
      }
    }

    fetchPatients()
  }, [])

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="filter-bar">
          <label>用户ID <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <label>姓名 <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <button className="search-btn" disabled>搜索</button>
        </div>
        <table className="patient-table">
          <thead>
            <tr>
              <th>用户ID</th>
              <th>姓名</th>
              <th>手机号</th>
              <th>性别</th>
              <th>年龄</th>
              <th>手术类型</th>
              <th>手术时间</th>
              <th>出院时间</th>
              <th>最新INR</th>
              <th>检验时间</th>
              <th>当前剂量</th>
              <th>建议剂量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.gender}</td>
                <td>{p.age}</td>
                <td>{p.surgeryType}</td>
                <td>{p.surgeryDate}</td>
                <td>{p.dischargeDate}</td>
                <td>{p.latestINR}</td>
                <td>{p.testDate}</td>
                <td>{p.currentDose}</td>
                <td>{p.suggestedDose}</td>
                <td>
                  <a href="#" style={{ color: '#1677ff' }} onClick={(e) => {
                    e.preventDefault();
                    navigate(`/patient/${p.id}`);
                  }}>查看</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}

function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 本地交互状态
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ doctorDose: '', note: '' });

  useEffect(() => {
    if (!patientId) {
      setError('No patient ID provided');
      setLoading(false);
      return;
    }

    const fetchPatientDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/patients/${patientId}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        const result = await response.json();
        if (result.success) {
          setPatient(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch patient details');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientDetail();
  }, [patientId]);


  if (loading) {
    return <div>正在加载患者详情...</div>;
  }
  if (error) {
    return <div>加载出错: {error}</div>;
  }
  if (!patient) {
    return <div>未找到该患者的信息</div>;
  }

  // 编辑保存 (TODO: call API)
  const handleSave = (rowId: string) => {
    console.log("Saving...", rowId, editValues);
    setEditRow(null);
  };

  // 确认 (TODO: call API)
  const handleConfirm = (rowId: string) => {
    if (!window.confirm('确认要将此条用药记录设为已确认吗？')) return;
    // console.log("Confirming...", rowId);
    setEditRow(null);
  };

  // 拒绝 (TODO: call API)
  const handleReject = (rowId: string) => {
    if (!window.confirm('确认要将此条用药记录设为已拒绝吗？')) return;
    // console.log("Rejecting...", rowId);
    setEditRow(null);
  };

  // 进入编辑
  const handleEdit = (row: any) => {
    setEditRow(row.id);
    setEditValues({ doctorDose: row.doctorDose || '', note: row.note || '' });
  };

  // 取消编辑
  const handleCancel = () => {
    setEditRow(null);
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        {/* 患者信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>患者信息</div>
          <table className="patient-table" style={{ width: 'auto', minWidth: 400 }}>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>姓名</th>
                <th>手机号</th>
                <th>性别</th>
                <th>年龄</th>
                <th>主管医生</th>
                <th>所属医院</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{patient.patient_id}</td>
                <td>{patient.patient_name}</td>
                <td>{patient.phone_number}</td>
                <td>{patient.gender === 'male' ? '男' : '女'}</td>
                <td>{calculateAge(patient.date_of_birth)}</td>
                <td>{patient.doctor_name}</td>
                <td>{patient.doctor_hospital}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* 病史信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>病史信息</div>
          <table className="patient-table" style={{ width: 'auto', minWidth: 400 }}>
            <thead>
              <tr>
                <th>手术类型</th>
                <th>手术时间</th>
                <th>出院时间</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{patient.surgery_type}</td>
                <td>{patient.operation_date}</td>
                <td>{patient.discharge_date}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* 用药记录 */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>用药记录</div>
          <table className="patient-table">
            <thead>
              <tr>
                <th>单号</th>
                <th>华法林当前用量</th>
                <th>系统建议用量</th>
                <th>确认状态</th>
                <th>医生确认用量</th>
                <th>备注</th>
                <th>提报时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {patient.medication_plans && patient.medication_plans.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.dose}</td>
                  <td>{r.sysDose}</td>
                  <td>
                    <StatusBadge status={r.confirmStatus} />
                  </td>
                  <td>
                    {editRow === r.id ? (
                      <input value={editValues.doctorDose} onChange={e => setEditValues(v => ({ ...v, doctorDose: e.target.value }))} style={{ width: 60 }} />
                    ) : (
                      r.doctorDose
                    )}
                  </td>
                  <td>
                    {editRow === r.id ? (
                      <input value={editValues.note} onChange={e => setEditValues(v => ({ ...v, note: e.target.value }))} style={{ width: 100 }} />
                    ) : (
                      r.note
                    )}
                  </td>
                  <td>{r.testDate}</td>
                  <td>
                    {r.confirmStatus === 'pending' ? (
                      editRow === r.id ? (
                        <>
                          <a href="#" style={{ color: '#1677ff', marginRight: 8 }} onClick={e => { e.preventDefault(); handleSave(r.id) }}>保存</a>
                          <a href="#" style={{ color: 'gray' }} onClick={e => { e.preventDefault(); handleCancel() }}>取消</a>
                        </>
                      ) : (
                        <>
                          <a href="#" style={{ color: '#1677ff', marginRight: 8 }} onClick={e => { e.preventDefault(); handleEdit(r) }}>修改</a>
                          <a href="#" style={{ color: 'red', marginRight: 8 }} onClick={e => { e.preventDefault(); handleConfirm(r.id) }}>确认</a>
                          <a href="#" style={{ color: 'gray' }} onClick={e => { e.preventDefault(); handleReject(r.id) }}>拒绝</a>
                        </>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

function AddPatientPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    gender: '男',
    phone: '',
    surgeryType: '',
    surgeryDate: '',
    dischargeDate: '',
    inr: '',
    inrDate: '',
    dose: '',
    note: '',
  })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors: Partial<typeof formData> = {}
    if (!formData.name.trim()) newErrors.name = '姓名不能为空'
    if (!formData.gender.trim()) newErrors.gender = '性别不能为空'
    if (!formData.phone.trim()) newErrors.phone = '手机号不能为空'
    if (!formData.surgeryType.trim()) newErrors.surgeryType = '手术类型不能为空'
    if (!formData.surgeryDate.trim()) newErrors.surgeryDate = '手术时间不能为空'
    if (!formData.dischargeDate.trim()) newErrors.dischargeDate = '出院时间不能为空'
    if (!formData.inr.trim()) newErrors.inr = 'INR不能为空'
    if (!formData.inrDate.trim()) newErrors.inrDate = 'INR检查时间不能为空'
    if (!formData.dose.trim()) newErrors.dose = '华法林剂量不能为空'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender === '男' ? 'male' : 'female',
          phone: formData.phone,
          operation_type: formData.surgeryType,
          operation_date: formData.surgeryDate,
          discharge_date: formData.dischargeDate,
          metric_value: formData.inr,
          doctor_suggested_dosage: formData.dose,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('患者注册成功！');
        // Optionally, reset form or redirect
        window.location.reload(); // Simple way to reset state
      } else {
        throw new Error(result.message || '注册失败');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`发生错误: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <form onSubmit={handleSubmit} className="add-patient-form">
          <div className="form-title">新增患者</div>
          <div className="form-fields">
            <label>姓名<span className="required">*</span> <input name="name" value={formData.name} onChange={handleChange} /></label>
            <label>性别<span className="required">*</span> <input name="gender" value={formData.gender} onChange={handleChange} /></label>
            <label>手机号<span className="required">*</span> <input name="phone" value={formData.phone} onChange={handleChange} maxLength={11} /></label>
            <label>手术类型<span className="required">*</span> <input name="surgeryType" value={formData.surgeryType} onChange={handleChange} /></label>
            <label>手术时间<span className="required">*</span> <input name="surgeryDate" value={formData.surgeryDate} onChange={handleChange} type="date" /></label>
            <label>出院时间<span className="required">*</span> <input name="dischargeDate" value={formData.dischargeDate} onChange={handleChange} type="date" /></label>
            <label>INR<span className="required">*</span> <input name="inr" value={formData.inr} onChange={handleChange} /></label>
            <label>INR检查时间<span className="required">*</span> <input name="inrDate" value={formData.inrDate} onChange={handleChange} type="date" /></label>
            <label>华法林剂量<span className="required">*</span> <input name="dose" value={formData.dose} onChange={handleChange} /></label>
            <label>备注 <textarea name="note" value={formData.note} onChange={handleChange} style={{ resize: 'none', height: 60 }} /></label>
          </div>
          {Object.entries(errors).map(([fieldName, errorMessage]) => (
            <div key={fieldName} className="form-error">{errorMessage}</div>
          ))}
          <button type="submit" className="form-submit-btn">注册新患者</button>
        </form>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientListPage />} />
      <Route path="/patient/:patientId" element={<PatientDetailPage />} />
      <Route path="/add-patient" element={<AddPatientPage />} />
    </Routes>
  );
}

export default App
