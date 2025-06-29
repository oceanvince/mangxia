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

// HomeButton component
function HomeButton() {
  const location = useLocation();
  const navigate = useNavigate();

  // Only show on pages other than home
  if (location.pathname === '/') return null;

  const handleHomeClick = () => {
    // Navigate to home and reload the app without clearing cache
    navigate('/');
    window.location.reload();
  };

  return (
    <button className="home-button" onClick={handleHomeClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      返回首页
    </button>
  );
}

function PatientListPage() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/patients');
      const data = await response.json();
      if (data.success) {
        setPatients(data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleConfirm = async (planId: string, systemSuggestedDose: string) => {
    if (!planId || !window.confirm('确认要采纳这条用药建议吗？')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/patients/medication-plan/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'active',
          doctor_suggested_dosage: systemSuggestedDose 
        }),
      });
      if (response.ok) {
        alert('操作成功！');
        fetchPatients(); // Refresh the list
      } else {
        throw new Error('操作失败');
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <HomeButton />
        <div className="filter-bar">
          <label>用户ID <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <label>姓名 <input type="text" disabled placeholder="（筛选功能暂未实现）" /></label>
          <button className="search-btn" disabled>搜索</button>
        </div>
        <table className="patient-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>手机号</th>
              <th>性别</th>
              <th>手术类型</th>
              <th>手术时间</th>
              <th>出院时间</th>
              <th>最新INR</th>
              <th>检验时间</th>
              <th>当前剂量(mg)</th>
              <th>建议剂量(mg)</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p: any) => (
              <tr key={p.patient_id}>
                <td>{p.patient_name}</td>
                <td>{p.phone_number}</td>
                <td>{p.gender === 'male' ? '男' : '女'}</td>
                <td>{p.operation_type}</td>
                <td>{p.operation_date}</td>
                <td>{p.discharge_date}</td>
                <td>{p.latest_inr || 'N/A'}</td>
                <td>{p.latest_inr_date || 'N/A'}</td>
                <td>{p.current_dose || 'N/A'}</td>
                <td>{p.suggested_dose || 'N/A'}</td>
                <td>
                  <StatusBadge status={p.latest_plan_status} />
                </td>
                <td>
                  {p.latest_plan_status === 'pending' ? (
                    <>
                      <button onClick={() => handleConfirm(p.latest_plan_id, p.suggested_dose)}>确认</button>
                      <button onClick={() => navigate(`/patient/${p.patient_id}`)}>查看</button>
                    </>
                  ) : (
                    <button onClick={() => navigate(`/patient/${p.patient_id}`)}>查看</button>
                  )}
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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [unbinding, setUnbinding] = useState(false);

  // 本地交互状态
  const [editRow, setEditRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ doctorDose: '', note: '' });
  const [editingPlan, setEditingPlan] = useState<any>(null); // State to track the plan being edited

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

  const handleEdit = (plan: any) => {
    setEditingPlan({ ...plan });
  };

  const handleCancel = () => {
    setEditingPlan(null);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    if (!window.confirm('您确定要保存此次修改吗？')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/patients/medication-plan/${editingPlan.plan_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active', // Saving implies confirmation
          doctor_suggested_dosage: editingPlan.doctor_suggested_dosage,
          remarks: editingPlan.remarks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save medication plan');
      }

      // Refetch patient data to show the update
      const updatedPatientResponse = await fetch(`http://localhost:3001/api/patients/${patientId}`);
      const updatedPatientData = await updatedPatientResponse.json();
      setPatient(updatedPatientData.data);

      setEditingPlan(null); // Exit editing mode
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("保存失败，请稍后再试。");
    }
  };

  const updatePlanStatus = async (planId: string, status: 'active' | 'rejected', systemSuggestedDosage?: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/patients/medication-plan/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          ...(status === 'active' && systemSuggestedDosage !== undefined && {
            doctor_suggested_dosage: systemSuggestedDosage
          })
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status === 'active' ? 'confirm' : 'reject'} plan`);
      }

      // Refetch patient data to show the update
      const updatedPatientResponse = await fetch(`http://localhost:3001/api/patients/${patientId}`);
      const updatedPatientData = await updatedPatientResponse.json();
      setPatient(updatedPatientData.data);

    } catch (error) {
      console.error(`Error updating plan status:`, error);
      alert("操作失败，请稍后再试。");
    }
  };

  const handleConfirm = (planId: string, plan: any) => {
    if (window.confirm('确认要采纳这条用药建议吗？')) {
      updatePlanStatus(planId, 'active', plan.system_suggested_dosage);
    }
  };

  const handleReject = (planId: string) => {
    if (window.confirm('确认要拒绝这条用药建议吗？')) {
      updatePlanStatus(planId, 'rejected');
    }
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerateQR = async () => {
    if (!patientId || generatingQR) return;

    setGeneratingQR(true);
    try {
      const response = await fetch(`http://localhost:3001/api/patients/${patientId}/qr-code`);
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      const result = await response.json();
      if (result.success) {
        setQrCode(result.data.qrCode);
        // Open QR code in a new window
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`
            <html>
              <head>
                <title>患者绑定二维码</title>
                <style>
                  body {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  .qr-container {
                    text-align: center;
                    padding: 20px;
                  }
                  .patient-name {
                    font-size: 24px;
                    margin-bottom: 20px;
                  }
                  .qr-code {
                    max-width: 300px;
                    margin-bottom: 20px;
                  }
                  .instructions {
                    color: #666;
                    max-width: 400px;
                    text-align: center;
                    line-height: 1.5;
                  }
                </style>
              </head>
              <body>
                <div class="qr-container">
                  <div class="patient-name">${patient.patient_name} 的绑定二维码</div>
                  <img src="${result.data.qrCode}" class="qr-code" />
                  <div class="instructions">
                    请让患者使用芒夏小程序扫描此二维码完成账号绑定。<br/>
                    二维码仅可使用一次，请勿重复使用。
                  </div>
                </div>
              </body>
            </html>
          `);
          win.document.close();
        }
      } else {
        throw new Error(result.error || '生成二维码失败');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      alert(error.message || '生成二维码失败，请稍后重试');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleUnbind = async () => {
    if (!patient?.wechat_id || !patientId || unbinding) return;

    if (!window.confirm('确定要解除此患者的微信绑定吗？解绑后患者需要重新扫码绑定。')) {
      return;
    }

    setUnbinding(true);
    try {
      // First get the account ID from the account_tab
      const accountResponse = await fetch(`http://localhost:3001/api/auth/account-by-wechat/${patient.wechat_id}`);
      const accountData = await accountResponse.json();
      
      if (!accountData.success || !accountData.data?.accountId) {
        throw new Error('获取账号信息失败');
      }

      const response = await fetch('http://localhost:3001/api/patients/unbind-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accountData.data.accountId,
          patientId: patientId
        }),
      });

      if (!response.ok) {
        throw new Error('解绑失败');
      }

      const result = await response.json();
      if (result.success) {
        alert('解绑成功');
        // Refresh patient data
        const updatedPatientResponse = await fetch(`http://localhost:3001/api/patients/${patientId}`);
        const updatedPatientData = await updatedPatientResponse.json();
        if (updatedPatientData.success) {
          setPatient(updatedPatientData.data);
        }
      } else {
        throw new Error(result.error || '解绑失败');
      }
    } catch (error: any) {
      console.error('Error unbinding account:', error);
      alert(error.message || '解绑失败，请稍后重试');
    } finally {
      setUnbinding(false);
    }
  };

  if (loading) {
    return <div>正在加载患者详情...</div>;
  }
  if (error) {
    return <div>加载出错: {error}</div>;
  }
  if (!patient) {
    return <div>未找到该患者的信息</div>;
  }

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <HomeButton />
        {/* 患者信息 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>患者信息</span>
            <button
              className="qr-code-button"
              onClick={handleGenerateQR}
              disabled={generatingQR}
            >
              {generatingQR ? '生成中...' : '生成绑定二维码'}
            </button>
          </div>
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
                <th>微信绑定状态</th>
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
                <td>
                  {patient.wechat_id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="wechat-status bound">
                        已绑定 ({patient.wechat_id.slice(0, 8)}...)
                      </span>
                      <button
                        onClick={handleUnbind}
                        disabled={unbinding}
                        className="unbind-button"
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          opacity: unbinding ? 0.7 : 1
                        }}
                      >
                        {unbinding ? '解绑中...' : '解除绑定'}
                      </button>
                    </div>
                  ) : (
                    <span className="wechat-status unbound">
                      未绑定
                    </span>
                  )}
                </td>
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
                <th>华法林之前用量</th>
                <th>最新INR</th>
                <th>化验时间</th>
                <th>更新建议用量</th>
                <th>医生确认用量</th>
                <th>确认状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {patient.medication_plans.map((plan: any) => (
                <tr key={plan.plan_id}>
                  <td>{plan.plan_id.slice(0, 8)}</td>
                  <td>{plan.previous_dosage || '-'}</td>
                  <td>{plan.inr_value || '-'}</td>
                  <td>{plan.measurement_date || '-'}</td>
                  <td>{plan.system_suggested_dosage || '-'}</td>
                  <td>
                    {editingPlan && editingPlan.plan_id === plan.plan_id ? (
                      <input
                        type="text"
                        name="doctor_suggested_dosage"
                        value={editingPlan.doctor_suggested_dosage || ''}
                        onChange={handlePlanChange}
                        style={{ width: '80px' }}
                      />
                    ) : (
                      plan.doctor_suggested_dosage || '-'
                    )}
                  </td>
                  <td><StatusBadge status={plan.status} /></td>
                  <td>
                    {editingPlan && editingPlan.plan_id === plan.plan_id ? (
                      <textarea
                        name="remarks"
                        value={editingPlan.remarks || ''}
                        onChange={handlePlanChange}
                        style={{ width: '120px', height: '40px' }}
                      />
                    ) : (
                      plan.remarks || '-'
                    )}
                  </td>
                  <td>
                    {editingPlan && editingPlan.plan_id === plan.plan_id ? (
                      <>
                        <button onClick={handleSave}>保存</button>
                        <button onClick={handleCancel}>取消</button>
                      </>
                    ) : (
                      <>
                        {plan.status === 'pending' ? (
                          <>
                            <button onClick={() => handleEdit(plan)}>修改</button>
                            <button onClick={() => handleConfirm(plan.plan_id, plan)}>确认</button>
                            <button onClick={() => handleReject(plan.plan_id)}>拒绝</button>
                          </>
                        ) : (
                          '已处理'
                        )}
                      </>
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
          measured_at: formData.inrDate,
          doctor_suggested_dosage: formData.dose,
          remarks: formData.note,
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
        <HomeButton />
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