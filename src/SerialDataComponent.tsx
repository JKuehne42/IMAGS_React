import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './SerialData.css'; // Import the external CSS

const SerialDataComponent: React.FC = () => {
    const [gsrData, setGsrData] = useState<number | null>(null);
    const [pulseData, setPulseData] = useState<number | null>(null);
    const [bpmData, setBpmData] = useState<number | null>(null);
    const [heartbeatDetected, setHeartbeatDetected] = useState<boolean | null>(null);
    const [port, setPort] = useState<any | null>(null);
    const [reader, setReader] = useState<any | null>(null);
    const [buffer, setBuffer] = useState<string>(''); // Buffer for accumulating chunks
    const [gsrChartData, setGsrChartData] = useState<{ time: number; gsr: number }[]>(
        new Array(30).fill({ time: Date.now(), gsr: 0 }) // Initialize with empty values
    );

    // Function to connect to the Arduino's serial port
    const connectToSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            setPort(port);
            setReader(reader);
            console.log('Connected to serial port');
        } catch (error) {
            console.error('Failed to connect to serial port:', error);
        }
    };

    // Function to process the buffered data and extract complete JSON objects
    const processBuffer = (data: string) => {
        let start = data.indexOf('{');
        let end = data.indexOf('}');

        while (start !== -1 && end !== -1 && end > start) {
            const jsonString = data.substring(start, end + 1);

            try {
                const jsonData = JSON.parse(jsonString);
                setGsrData(jsonData.GSR);
                setPulseData(jsonData.Pulse);
                setBpmData(jsonData.BPM);
                setHeartbeatDetected(jsonData.Heartbeat);

                // Add new GSR data point for the graph
                setGsrChartData((prevData) => {
                    const newData = [...prevData, { time: Date.now(), gsr: jsonData.GSR }];
                    return newData.slice(-30); // Keep only last 30 readings
                });

                console.log('Extracted JSON:', jsonData);
            } catch (error) {
                console.error('Failed to parse JSON:', jsonString, error);
            }

            // Remove the processed JSON from buffer
            data = data.substring(end + 1);
            start = data.indexOf('{');
            end = data.indexOf('}');
        }

        return data; // Return remaining buffer (incomplete data)
    };

    // Asynchronous serial data reader
    useEffect(() => {
        let intervalId: any;

        const readSerialData = async () => {
            if (!reader) return;

            try {
                const { value, done } = await reader.read();
                if (done) {
                    reader.releaseLock();
                    return;
                }

                if (value) {
                    // Append incoming data to buffer and process it
                    const newBuffer = buffer + value;
                    const remainingBuffer = processBuffer(newBuffer);
                    setBuffer(remainingBuffer);
                }
            } catch (error) {
                console.error('Error reading from serial port:', error);
            }
        };

        if (reader) {
            intervalId = setInterval(readSerialData, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [reader, buffer]);

    return (
        <div className="serial-container">
            <button className="connect-button" onClick={connectToSerial}>
                Connect to Arduino
            </button>

            <div className="serial-data-box">
                <div className="serial-header">Real-Time Sensor Data</div>

                <div className="serial-data-list">
                    {[
                        { label: 'GSR Data', value: gsrData, textClass: 'gsr-text' },
                        { label: 'Pulse Data', value: pulseData, textClass: 'pulse-text' },
                        { label: 'BPM', value: bpmData, textClass: 'bpm-text' },
                        {
                            label: 'Heartbeat Detected',
                            value: heartbeatDetected !== null ? (heartbeatDetected ? 'Yes' : 'No') : null,
                            textClass: 'heartbeat-text'
                        }
                    ].map(({ label, value, textClass }) => (
                        <div key={label} className="serial-data-item">
                            <span className="serial-label">{label}:</span>
                            <span className={`serial-value ${textClass}`}>
                                {value !== null ? value : 'No data'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Real-Time GSR Graph */}
            <div className="chart-container">
            <h2 style={{ color: "black" }}>GSR Data Over Time</h2>

                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={gsrChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                        />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="gsr" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SerialDataComponent;
