import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Tag, Card } from 'antd';
import { ShareAltOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAdminReferrals, type AdminReferralItem } from '../../services/admin.api';

export const AdminReferrals: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: getAdminReferrals,
  });

  const columns = [
    {
      title: 'Referral Kodi (Hamkor)',
      dataIndex: 'referralCode',
      key: 'referralCode',
      render: (val: string) => (
        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          {val}
        </span>
      ),
    },
    {
      title: 'Jami Buyurtmalar',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      render: (val: number) => <span className="font-bold text-white">{val} ta</span>,
    },
    {
      title: 'Buyurtmalar Summasi',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => (
        <span className="font-semibold text-slate-200">${val.toLocaleString()}</span>
      ),
    },
    {
      title: 'Hamkor Komissiyasi',
      dataIndex: 'commission',
      key: 'commission',
      render: (val: number) => (
        <span className="font-bold text-emerald-400">${val.toLocaleString()}</span>
      ),
    },
    {
      title: 'Stavka',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (val: number) => <Tag color="purple">{val * 100}%</Tag>,
    },
  ];

  const totalReferralAmount = (data || []).reduce((sum, item) => sum + item.totalAmount, 0);
  const totalCommission = (data || []).reduce((sum, item) => sum + item.commission, 0);
  const totalBookings = (data || []).reduce((sum, item) => sum + item.totalBookings, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShareAltOutlined className="text-indigo-400" /> Hamkorlar & Referral Statistikasi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mehmonxonalar va QR kod hamkorlik dasturi orqali jalb qilingan buyurtmalar va to'lovlar
          </p>
        </div>

        <Button
          icon={<ReloadOutlined className={isFetching ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
          loading={isFetching}
          className="bg-slate-800 text-slate-200 border-slate-700 hover:text-amber-400"
        >
          Yangilash
        </Button>
      </div>

      {/* Umumiy Xulosa Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase">Hamkorlar Orqali Buyurtmalar</div>
          <div className="text-2xl font-black text-white mt-1">{totalBookings} ta</div>
        </div>
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase">Jami Tushum</div>
          <div className="text-2xl font-black text-white mt-1">${totalReferralAmount.toLocaleString()}</div>
        </div>
        <div className="bg-[#131A22] rounded-2xl p-5 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase">To'lanadigan Komissiya</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">${totalCommission.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-[#131A22] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <Table
          dataSource={data || []}
          columns={columns}
          rowKey="referralCode"
          loading={isLoading}
          pagination={false}
          className="dark-table"
        />
      </div>
    </div>
  );
};
export default AdminReferrals;
