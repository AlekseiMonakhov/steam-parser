import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Chart: React.FC<ChartProps> = ({ data, itemName }) => {
    const chartData = {
        labels: data.map(pz => pz.coefficientPZ),
        datasets: [
            {
                label: `${itemName}`,
                data: data.map(pz => pz.price),
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.2)',
                fill: true,
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        scales: {
            x: {
                type: 'linear',
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
            <Line data={chartData} options={options} />
        </div>
    );
};

export default Chart;
