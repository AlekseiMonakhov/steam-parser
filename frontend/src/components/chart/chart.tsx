import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import styles from './chart.module.css';

interface PZCoefficient {
    price: string;
    coefficientPZ: number;
}

interface ChartProps {
    data: PZCoefficient[];
    itemName: string;
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Chart: React.FC<ChartProps> = ({ data, itemName }) => {
    const chartData = {
        labels: data.map(pz => pz.coefficientPZ),
        datasets: [
            {
                label: `${itemName}`,
                data: data.map(pz => pz.price),
                backgroundColor: 'rgba(75,192,192,0.6)',
                borderColor: 'rgba(75,192,192,1)',
                borderWidth: 1,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        scales: {
            x: {
                type: 'category',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Коэффициент ПЗ',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Цена',
                },
            },
        },
    };

    return (
        <div className={styles.chartContainer}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default Chart;
