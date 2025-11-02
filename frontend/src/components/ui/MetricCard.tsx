export function MetricCard({
  color,
  label,
  value
}: {
  color: string;
  label: string;
  value: number | string;
}) {
  const colorMap: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    red: 'text-red-600 bg-red-50 border-red-100'
  };
  return (
    <div className={`p-6 rounded-xl shadow-sm text-center border ${colorMap[color]}`}>
      <p className={`text-3xl font-bold ${colorMap[color].split(' ')[0]}`}>{value}</p>
      <p className="text-gray-700 mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}