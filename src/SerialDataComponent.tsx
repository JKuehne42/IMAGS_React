import React, { useState, useEffect } from 'react';

const SerialDataComponent: React.FC = () => {
    const [gsrData, setGsrData] = useState<number | null>(null);
    const [pulseData, setPulseData] = useState<number | null>(null);
    const [bpmData, setBpmData] = useState<number | null>(null);
    const [heartbeatDetected, setHeartbeatDetected] = useState<boolean | null>(null);
    const [port, setPort] = useState<any | null>(null);
    const [reader, setReader] = useState<any | null>(null);
    const [buffer, setBuffer] = useState<string>(''); // Buffer for accumulating chunks

    // Function to connect to the Arduino's serial port
    const connectToSerial = async () => {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
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

    // Asynchronous serial data reader using setInterval to avoid stalling the main thread
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
            // Use setInterval to repeatedly check for new data every 100ms
            intervalId = setInterval(readSerialData, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [reader, buffer]);

    return (
        <div style={{ position: 'relative', zIndex: 10, padding: '20px' }}>
            <button
                onClick={connectToSerial}
                style={{
                    padding: '10px',
                    margin: '20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    zIndex: 10,
                    position: 'relative',
                }}
            >
                Connect to Arduino
            </button>
            <div>
                <p>GSR Data: {gsrData !== null ? gsrData : 'No data'}</p>
                <p>Pulse Data: {pulseData !== null ? pulseData : 'No data'}</p>
                <p>BPM: {bpmData !== null ? bpmData : 'No data'}</p>
                <p>Heartbeat Detected: {heartbeatDetected !== null ? (heartbeatDetected ? 'Yes' : 'No') : 'No data'}</p>
            </div>
        </div>
    );
};

export default SerialDataComponent;

