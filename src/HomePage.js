import React, { useState } from 'react';
import styled from 'styled-components';
import Latex from 'react-latex';

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
`;

const HeroSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    flex: 1;
`;

const Heading = styled.h1`
    font-size: 2.5rem;
    font-weight: bold;
    color: #333;
`;

const SubText = styled.p`
    font-size: 1.2rem;
    color: #555;
    text-align: center;
    max-width: 800px;
`;

const LatexWrapper = styled.div`
    font-size: 1.1rem;
    color: #333;
    margin-top: 1rem;
    text-align: center;
`;

const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 1rem;
    width: 100%;
    max-width: 800px;
`;

const MatrixWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
`;

const Label = styled.label`
    margin-top: 1rem;
    font-size: 1rem;
    color: #444;
`;

const InputField = styled.input`
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    text-align: center;
    width: 60px;
`;

const Button = styled.button`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        background-color: #0056b3;
    }
`;

const Footer = styled.footer`
    width: 100%;
    text-align: center;
    padding: 1rem;
    background-color: #f1f1f1;
`;

const HomePage = () => {
    const [coordinates, setCoordinates] = useState('');
    const [omega, setOmega] = useState('');
    const [metric, setMetric] = useState(Array(4).fill(Array(4).fill('')));
    const [energyMomentum, setEnergyMomentum] = useState(Array(4).fill(Array(4).fill('')));
    const [potential, setPotential] = useState('');
    const [phi, setPhi] = useState('');
    const [latexOutput, setLatexOutput] = useState('');

    const handleMatrixChange = (row, col, value, setMatrix) => {
        setMatrix(prevMatrix => {
            const newMatrix = prevMatrix.map((r, i) => (i === row ? [...r] : r));
            newMatrix[row][col] = value;
            return newMatrix;
        });
    };

    const runPythonCode = async () => {
        const pyodide = await window.loadPyodide();
        await pyodide.loadPackage("sympy");

        const pythonCode = `
import sympy as sp

# Collecting inputs
coordinates = sp.symbols(${JSON.stringify(coordinates.split(','))})
phi = sp.symbols('phi')
omega = ${omega};
metric = sp.Matrix(${JSON.stringify(metric).replace(/"/g, "'")});
energy_momentum_tensor = sp.Matrix(${JSON.stringify(energyMomentum).replace(/"/g, "'")});
potential = sp.sympify('${potential}');
derivative_of_potential = sp.diff(potential, phi);
phi = sp.sympify('${phi}')
derivative_of_potential = derivative_of_potential.subs(sp.Symbol('phi'), phi)


size = len(coordinates)
derivatives_of_scalar_field = [sp.diff(phi, coord) for coord in coordinates]

inverse = metric.inv()
determinant = metric.det()

# Compute the kinetic term g^{\alpha\beta}\partial_{\alpha}\phi\partial_{\beta}\phi
kinetic_term = sum(inverse[mu, nu] * derivatives_of_scalar_field[mu] * derivatives_of_scalar_field[nu]
                   for mu in range(size) for nu in range(size))

# Compute the trace of the energy momentum tensor
trace_of_energy_momentum_tensor = sum(inverse[mu, nu] * energy_momentum_tensor[mu, nu]
                                        for mu in range(size) for nu in range(size))

# Compute the Laplace-Beltrami operator
laplace_beltrami = ((8 * sp.pi * trace_of_energy_momentum_tensor) + 
                    (2 * potential - phi * derivative_of_potential)) / (3 + 2 * omega)

# Compute the Einstein tensor
einstein_tensor = sp.Matrix.zeros(size, size)
for mu in range(size):
    for nu in range(size):
        einstein_tensor[mu, nu] = ((8 * sp.pi / phi) * trace_of_energy_momentum_tensor + 
                                   (omega / phi**2) * (derivatives_of_scalar_field[mu] * derivatives_of_scalar_field[nu] - 
                                   0.5 * metric[mu, nu] * kinetic_term) + 
                                   (1 / phi) * (sp.diff(phi, coordinates[mu], coordinates[nu]) - 
                                   metric[mu, nu] * laplace_beltrami) - 
                                   0.5 * metric[mu, nu] * potential / (phi))

latex_output = sp.latex(einstein_tensor)
latex_output
        `;
        const result = await pyodide.runPython(pythonCode);
        setLatexOutput(result);  // Store the LaTeX output
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(latexOutput);
        alert('LaTeX code copied to clipboard!');
    };

    return (
        <PageContainer>
            <HeroSection>
                <Heading>Brans-Dicke Theory Solver</Heading>
                <SubText>
                    This tool provides a framework to derive the Einstein tensor for any gravitational metric and scalar field with or without potential using the 
                    <a href="https://en.wikipedia.org/wiki/Brans%E2%80%93Dicke_theory" target="_blank" rel="noopener noreferrer"> Brans-Dicke theory</a>, 
                    which is a scalar-tensor theory of gravitation often considered to be a competitor to Einstein's theory of general relativity. The action for the Brans-Dicke theory is given by:
                </SubText>
                <LatexWrapper>
                    <Latex displayMode={true}>
                        {`$S = (16\\pi)^{-1} \\int \\mathrm d^4 x \\sqrt{-g}\\left(\\phi R - (\\omega/\\phi) \\partial_a\\phi\\partial^a\\phi\\right)$`}
                    </Latex>
                </LatexWrapper>
                <SubText>
                    where <Latex>{`$\\phi$`}</Latex> is the scalar field, <Latex>{`$R$`}</Latex> is the Ricci scalar, <Latex>{`$\\omega$`}</Latex> is the Brans-Dicke parameter, and <Latex>{`$g$`}</Latex> is the determinant of the metric tensor.
                    Note: We set the matter Lagrangian to zero for simplicity. Varying this with respect to the metric tensor and the scalar field gives the field equations.
                </SubText>
                <LatexWrapper>
                    <Latex displayMode={true}>
                        {`$G_{\\mu\\nu} = (8\\pi/\\phi)T_{\\mu\\nu} + (\\omega/\\phi^2) \\left(\\partial_{\\mu}\\phi\\partial_{\\nu}\\phi - 0.5g_{\\mu\\nu}\\partial_{\\sigma}\\phi\\partial^{\\sigma}\\phi\\right) + (1/\\phi)(\\partial_{\\mu}\\partial_{\\nu}\\phi - g_{\\mu\\nu}\\Box\\phi) - g_{\\mu\\nu} (V/2\\phi)$`}
                    </Latex>
                </LatexWrapper>
                <SubText>
                    where <Latex>{`$G_{\\mu\\nu}$`}</Latex> is the Einstein tensor, <Latex>{`$T_{\\mu\\nu}$`}</Latex> is the stress-energy tensor, <Latex>{`$V$`}</Latex> is the potential, and <Latex>{`$\\Box$`}</Latex> is the Laplace-Beltrami operator.
                </SubText>
                <LatexWrapper>
                    <Latex displayMode={true}>
                        {`$\\Box\\phi = (8\\pi T + 2V - \\phi V')/(3+2\\omega)$`}
                    </Latex>
                </LatexWrapper>
                
                {/* Input Fields */}
                <InputWrapper>
                    <Label>
                        Enter coordinates (comma-separated):
                        <InputField type="text" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} />
                    </Label>
                    <Label>
                        Enter coupling factor (omega):
                        <InputField type="number" value={omega} onChange={(e) => setOmega(e.target.value)} />
                    </Label>

                    {/* Metric Tensor Input */}
                    <Label>Enter metric tensor:</Label>
                    <MatrixWrapper>
                        {metric.map((row, rowIndex) =>
                            row.map((value, colIndex) => (
                                <InputField
                                    key={`metric-${rowIndex}-${colIndex}`}
                                    type="text"
                                    value={metric[rowIndex][colIndex]}
                                    onChange={(e) =>
                                        handleMatrixChange(rowIndex, colIndex, e.target.value, setMetric)
                                    }
                                />
                            ))
                        )}
                    </MatrixWrapper>

                    {/* Energy-Momentum Tensor Input */}
                    <Label>Enter energy-momentum tensor:</Label>
                    <MatrixWrapper>
                        {energyMomentum.map((row, rowIndex) =>
                            row.map((value, colIndex) => (
                                <InputField
                                    key={`energyMomentum-${rowIndex}-${colIndex}`}
                                    type="text"
                                    value={energyMomentum[rowIndex][colIndex]}
                                    onChange={(e) =>
                                        handleMatrixChange(rowIndex, colIndex, e.target.value, setEnergyMomentum)
                                    }
                                />
                            ))
                        )}
                    </MatrixWrapper>

                    <Label>
                        Enter scalar field (phi):
                        <InputField type="text" value={phi} onChange={(e) => setPhi(e.target.value)} />
                    </Label>
                    <Label>
                        Enter potential:
                        <InputField type="text" value={potential} onChange={(e) => setPotential(e.target.value)} />
                    </Label>
                    <Button onClick={runPythonCode}>Calculate Einstein Tensor</Button>
                </InputWrapper>

                {latexOutput && (
                    <>
                        <SubText style = {{marginTop: '20px'}}>Einstein Tensor Result:</SubText>
                        <LatexWrapper>
                            <Latex displayMode={true}>{latexOutput}</Latex>
                        </LatexWrapper>
                        <Button onClick={copyToClipboard}>Copy LaTeX Code</Button>
                    </>
                )}
            </HeroSection>
            <Footer>&copy; <a href = "https://avirald.me">Aviral Damle</a>, 2024</Footer>
        </PageContainer>
    );
};

export default HomePage;
