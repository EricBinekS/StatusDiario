import React from 'react';

export const AtividadesTable = ({ data }) => {
  const styles = {
    tableContainer: {
      overflowX: 'auto',
      width: '100%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      tableLayout: 'fixed',
      backgroundColor: 'white',
      fontSize: '0.875rem',
    },
    th: {
      padding: '12px 16px',
      textAlign: 'left',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      fontWeight: '600',
      textTransform: 'uppercase',
      fontSize: '0.75rem',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      color: '#1f2937',
      verticalAlign: 'middle',
    },
    colAtivo: {
      width: '110px',
      fontWeight: '600',
      color: '#2563eb',
    },
    colAtividade: {
      width: 'auto',
      fontSize: '0.75rem',
      lineHeight: '1.4',
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
    colStatus: {
      width: '110px',
    },
    colData: {
      width: '140px',
      fontSize: '0.75rem',
    }
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Nenhuma atividade encontrada.
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.colAtivo }}>Ativo</th>
            <th style={{ ...styles.th, ...styles.colAtividade }}>Atividade</th>
            <th style={{ ...styles.th, ...styles.colStatus }}>Status</th>
            <th style={{ ...styles.th, ...styles.colData }}>Início</th>
            <th style={{ ...styles.th, ...styles.colData }}>Fim</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ ...styles.td, ...styles.colAtivo }}>
                {row.ativo || row.equipamento || '-'}
              </td>
              
              <td 
                style={{ ...styles.td, ...styles.colAtividade }} 
                title={row.atividade || row.descricao}
              >
                {row.atividade || row.descricao || '-'}
              </td>

              <td style={styles.td}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.70rem',
                    fontWeight: '600',
                    backgroundColor: row.status === 'Concluído' ? '#d1fae5' : '#fee2e2',
                    color: row.status === 'Concluído' ? '#065f46' : '#991b1b',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.status || 'Pendente'}
                </span>
              </td>

              <td style={{ ...styles.td, ...styles.colData }}>
                {row.data_inicio ? new Date(row.data_inicio).toLocaleString() : '-'}
              </td>
              <td style={{ ...styles.td, ...styles.colData }}>
                {row.data_fim ? new Date(row.data_fim).toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
